import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { GenerateSeoBody } from "@workspace/api-zod";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/seo/generate", async (req, res) => {
  const parsed = GenerateSeoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { serviceName, language = "ar", tone = "professional" } = parsed.data;

  const langLabel = language === "ar" ? "Arabic" : "English";
  const toneLabel =
    tone === "professional"
      ? "professional and authoritative"
      : tone === "friendly"
        ? "friendly and approachable"
        : "persuasive and compelling";

  const systemPrompt = `You are an expert SEO content strategist. Generate complete SEO content for a service or product. 
Respond ONLY with valid JSON. No markdown, no code blocks, just raw JSON.
All text content must be in ${langLabel}.
Use a ${toneLabel} tone.`;

  const userPrompt = `Generate complete SEO content for the following service: "${serviceName}"

Return a JSON object with exactly these fields:
{
  "title": "SEO page title, 50-60 characters, includes primary keyword",
  "metaDescription": "Meta description, 150-160 characters, compelling call to action",
  "keywords": ["keyword1", "keyword2", ...], // 8-12 relevant keywords and phrases
  "slogan": "Short memorable tagline, max 10 words",
  "ogTitle": "Open Graph title for social sharing, max 60 chars",
  "ogDescription": "Open Graph description for social sharing, 1-2 sentences",
  "twitterTitle": "Twitter card title, max 70 chars",
  "twitterDescription": "Twitter card description, max 200 chars",
  "canonicalSlug": "url-friendly-slug-no-spaces-no-arabic",
  "faqItems": [
    {"question": "Common question about the service", "answer": "Detailed helpful answer"},
    {"question": "Another question", "answer": "Detailed helpful answer"},
    {"question": "Third question", "answer": "Detailed helpful answer"}
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    const result = JSON.parse(content);

    // Ensure keywords is always an array
    if (!Array.isArray(result.keywords)) {
      result.keywords = [];
    }
    if (!Array.isArray(result.faqItems)) {
      result.faqItems = [];
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "OpenAI request failed");
    res.status(500).json({ error: "Failed to generate SEO content" });
  }
});

export default router;
