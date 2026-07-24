import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { GenerateSeoBody } from "@workspace/api-zod";

const router: IRouter = Router();

function getProviderClient(provider: string): { client: OpenAI; model: string } {
  switch (provider) {
    case "gemini":
      return {
        client: new OpenAI({
          apiKey: process.env.GEMINI_API_KEY ?? "",
          baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        }),
        model: "gemini-2.0-flash",
      };
    case "qwen":
      return {
        client: new OpenAI({
          apiKey: process.env.QWEN_API_KEY ?? "",
          baseURL: `https://${process.env.QWEN_API_HOST ?? "ws-ug1fsmrwphwa3o5p.ap-southeast-1.maas.aliyuncs.com"}/v1`,
        }),
        model: "qwen-max",
      };
    case "zhipu":
      return {
        client: new OpenAI({
          apiKey: process.env.ZHIPU_API_KEY ?? "",
          baseURL: "https://open.bigmodel.cn/api/paas/v4/",
        }),
        model: "glm-4-flash",
      };
    default: // openai
      return {
        client: new OpenAI({
          apiKey: process.env.OPENAI_API_KEY ?? "",
        }),
        model: "gpt-4o-mini",
      };
  }
}

function extractJson(raw: string): string {
  // Strip markdown code fences if present
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Find first { ... } block
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw.trim();
}

router.post("/seo/generate", async (req, res) => {
  const parsed = GenerateSeoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const {
    serviceName,
    language = "ar",
    tone = "professional",
    provider = "openai",
  } = parsed.data;

  const langLabel = language === "ar" ? "Arabic" : "English";
  const toneLabel =
    tone === "professional"
      ? "professional and authoritative"
      : tone === "friendly"
        ? "friendly and approachable"
        : "persuasive and compelling";

  const { client, model } = getProviderClient(provider);

  const systemPrompt = `You are an expert SEO content strategist. Generate complete SEO content for a service or product.
Respond ONLY with valid JSON. No markdown, no code blocks, no explanations — raw JSON only.
All text content must be in ${langLabel}.
Use a ${toneLabel} tone.`;

  const userPrompt = `Generate complete SEO content for this service: "${serviceName}"

Return a JSON object with EXACTLY these fields:
{
  "title": "SEO page title, 50-60 characters, primary keyword included",
  "metaDescription": "Meta description, 150-160 characters, with call to action",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "slogan": "Short memorable tagline, max 10 words",
  "ogTitle": "Open Graph title, max 60 characters",
  "ogDescription": "Open Graph description, 1-2 sentences",
  "twitterTitle": "Twitter card title, max 70 characters",
  "twitterDescription": "Twitter card description, max 200 characters",
  "canonicalSlug": "url-friendly-slug-lowercase-no-spaces",
  "faqItems": [
    {"question": "Question about the service?", "answer": "Helpful detailed answer."},
    {"question": "Second question?", "answer": "Helpful detailed answer."},
    {"question": "Third question?", "answer": "Helpful detailed answer."}
  ]
}`;

  try {
    // Use json_object format for OpenAI; others get JSON via prompt
    const useJsonFormat = provider === "openai";

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      ...(useJsonFormat ? { response_format: { type: "json_object" } } : {}),
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "No response from AI provider" });
      return;
    }

    const jsonStr = extractJson(content);
    const result = JSON.parse(jsonStr);

    if (!Array.isArray(result.keywords)) result.keywords = [];
    if (!Array.isArray(result.faqItems)) result.faqItems = [];

    res.json(result);
  } catch (err: unknown) {
    req.log.error({ err, provider }, "AI provider request failed");
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: `Generation failed with provider "${provider}": ${message}`,
    });
  }
});

export default router;
