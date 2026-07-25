/**
 * Quick SEO Tools:
 *  POST /api/tools/robots     — generate robots.txt
 *  POST /api/tools/hreflang   — generate hreflang tags
 *  POST /api/tools/schema     — generate a specific schema type
 *  POST /api/tools/sitemap    — generate sitemap XML skeleton
 */
import { Router, type IRouter } from "express";
import { z } from "zod";
import { getAiClient, callAiJson } from "../lib/ai.js";
import { loadConfig, resolveKey }  from "./settings.js";

const router: IRouter = Router();

function checkKey(provider: string, cfg: ReturnType<typeof loadConfig>): string | undefined {
  const keyMap: Record<string,string> = { gemini:"GEMINI_API_KEY", qwen:"QWEN_API_KEY", zhipu:"ZHIPU_API_KEY", openai:"OPENAI_API_KEY" };
  const cfgKey = cfg[provider as keyof typeof cfg] as { key?: string } | undefined;
  return resolveKey(cfgKey?.key, keyMap[provider]);
}

/* ─── POST /api/tools/robots ─── */
const RobotsBody = z.object({
  domain:      z.string().min(1),
  sitemapUrl:  z.string().optional(),
  allowAll:    z.boolean().default(true),
  disallow:    z.array(z.string()).default([]),
  provider:    z.enum(["openai","gemini","qwen","zhipu"]).default("zhipu"),
  siteType:    z.string().default("general"),
  crawlDelay:  z.number().optional(),
});

router.post("/tools/robots", async (req, res) => {
  const parsed = RobotsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات غير صالحة" }); return; }
  const { domain, sitemapUrl, allowAll, disallow, provider, siteType, crawlDelay } = parsed.data;

  const cfg = loadConfig();
  if (!checkKey(provider, cfg)) { res.status(400).json({ error: `مفتاح ${provider} غير مضبوط` }); return; }

  try {
    const ai = getAiClient(provider);
    const systemPrompt = `You are an SEO technical expert. Generate an optimal robots.txt file and explain each directive. Return only valid JSON.`;
    const userPrompt = `Generate robots.txt for:
Domain: ${domain}
Site type: ${siteType}
Allow all crawlers: ${allowAll}
Disallow paths: ${JSON.stringify(disallow)}
Sitemap URL: ${sitemapUrl ?? `https://${domain}/sitemap.xml`}
Crawl delay: ${crawlDelay ?? "not specified"}

Return JSON:
{
  "robotsTxt": "full robots.txt content as string with newlines",
  "explanation": [
    { "directive": "User-agent: *", "meaning": "explanation" }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "warnings": ["warning if any"]
}`;

    const result = await callAiJson(ai, systemPrompt, userPrompt, { maxTokens: 2000 });
    res.json(result);
  } catch {
    res.status(500).json({ error: "فشل توليد robots.txt" });
  }
});

/* ─── POST /api/tools/hreflang ─── */
const HreflangBody = z.object({
  baseUrl:   z.string().url(),
  pages:     z.array(z.object({
    path:    z.string(),
    title:   z.string(),
    langs:   z.array(z.string()),
  })),
  provider:  z.enum(["openai","gemini","qwen","zhipu"]).default("zhipu"),
  defaultLang: z.string().default("ar"),
});

router.post("/tools/hreflang", async (req, res) => {
  const parsed = HreflangBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات غير صالحة" }); return; }
  const { baseUrl, pages, provider, defaultLang } = parsed.data;

  const cfg = loadConfig();
  if (!checkKey(provider, cfg)) { res.status(400).json({ error: `مفتاح ${provider} غير مضبوط` }); return; }

  try {
    const ai = getAiClient(provider);
    const systemPrompt = `You are a multilingual SEO expert. Generate correct hreflang implementations. Return only valid JSON.`;
    const userPrompt = `Generate hreflang tags for a multilingual site:
Base URL: ${baseUrl}
Default language: ${defaultLang}
Pages: ${JSON.stringify(pages)}

Return JSON:
{
  "hreflangTags": [
    {
      "page": "/path",
      "tags": [
        { "lang": "ar", "url": "https://...", "tag": "<link rel=\\"alternate\\" hreflang=\\"ar\\" href=\\"...\\" />" }
      ]
    }
  ],
  "htmlHeadCode": "all hreflang link tags for copy-paste into <head>",
  "implementation": {
    "headSection": "<!-- hreflang tags to add in <head> -->\\n<link rel=\\"alternate\\" .../>",
    "serverSide": "how to implement dynamically",
    "cms": "WordPress/other CMS plugin recommendation"
  },
  "bestPractices": ["best practice 1", "best practice 2"],
  "commonMistakes": ["mistake 1", "mistake 2"]
}`;

    const result = await callAiJson(ai, systemPrompt, userPrompt, { maxTokens: 4000 });
    res.json(result);
  } catch {
    res.status(500).json({ error: "فشل توليد hreflang" });
  }
});

/* ─── POST /api/tools/schema ─── */
const SchemaBody = z.object({
  schemaType:  z.string().min(1),
  data:        z.record(z.unknown()),
  provider:    z.enum(["openai","gemini","qwen","zhipu"]).default("zhipu"),
  language:    z.string().default("ar"),
});

router.post("/tools/schema", async (req, res) => {
  const parsed = SchemaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات غير صالحة" }); return; }
  const { schemaType, data, provider, language } = parsed.data;

  const cfg = loadConfig();
  if (!checkKey(provider, cfg)) { res.status(400).json({ error: `مفتاح ${provider} غير مضبوط` }); return; }

  try {
    const ai = getAiClient(provider);
    const systemPrompt = `You are a Schema.org expert. Generate valid, Google-compliant JSON-LD structured data. Return only valid JSON.`;
    const userPrompt = `Generate ${schemaType} Schema.org JSON-LD for:
${JSON.stringify(data, null, 2)}
Language: ${language}

Return JSON:
{
  "schemaType": "${schemaType}",
  "jsonLd": { "@context": "https://schema.org", "@type": "${schemaType}" },
  "embedCode": "<script type=\\"application/ld+json\\">\\n{...}\\n</script>",
  "fields": [
    { "field": "@type", "value": "${schemaType}", "required": true, "description": "Schema type" }
  ],
  "validationUrl": "https://validator.schema.org/",
  "richResultsUrl": "https://search.google.com/test/rich-results",
  "notes": ["Important note about this schema type"]
}`;

    const result = await callAiJson(ai, systemPrompt, userPrompt, { maxTokens: 3000 });
    // Stringify jsonLd if it's an object
    const r = result as Record<string, unknown>;
    if (r.jsonLd && typeof r.jsonLd === "object") {
      r.embedCode = `<script type="application/ld+json">\n${JSON.stringify(r.jsonLd, null, 2)}\n</script>`;
      r.jsonLd = JSON.stringify(r.jsonLd, null, 2);
    }
    res.json(result);
  } catch {
    res.status(500).json({ error: "فشل توليد Schema" });
  }
});

export default router;
