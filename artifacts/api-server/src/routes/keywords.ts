/**
 * Keyword Research route — AI-powered keyword clustering, intent analysis,
 * difficulty estimation, and semantic expansion.
 */
import { Router, type IRouter } from "express";
import { z } from "zod";
import { getAiClient, callAiJson } from "../lib/ai.js";
import { loadConfig, resolveKey }  from "./settings.js";

const router: IRouter = Router();

const KeywordBody = z.object({
  seedKeyword:  z.string().min(1).max(200),
  language:     z.enum(["ar","en"]).default("ar"),
  provider:     z.enum(["openai","gemini","qwen","zhipu"]).default("zhipu"),
  businessType: z.string().default("general"),
  location:     z.string().default(""),
  count:        z.number().int().min(20).max(100).default(40),
});

/* ─── POST /api/keywords/research ─── */
router.post("/keywords/research", async (req, res) => {
  const parsed = KeywordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: `بيانات غير صالحة: ${parsed.error.issues.map(i => i.message).join(", ")}` });
    return;
  }
  const { seedKeyword, language, provider, businessType, location, count } = parsed.data;

  const cfg = loadConfig();
  const keyMap: Record<string,string> = { gemini:"GEMINI_API_KEY", qwen:"QWEN_API_KEY", zhipu:"ZHIPU_API_KEY", openai:"OPENAI_API_KEY" };
  const cfgKey = cfg[provider as keyof typeof cfg] as { key?: string } | undefined;
  const key = resolveKey(cfgKey?.key, keyMap[provider]);
  if (!key) { res.status(400).json({ error: `مفتاح ${provider} غير مضبوط` }); return; }

  try {
    const ai = getAiClient(provider);
    const langLabel = language === "ar" ? "Arabic" : "English";
    const locCtx = location ? ` in ${location}` : "";

    const systemPrompt = `You are an expert keyword research analyst specializing in ${langLabel} SEO${locCtx}. Generate comprehensive, realistic keyword research data. All keyword text in ${langLabel}. Return only valid JSON.`;

    const userPrompt = `Perform comprehensive keyword research for: "${seedKeyword}"
Business type: ${businessType}${location ? `\nTarget location: ${location}` : ""}
Generate exactly ${count} keywords.

Return this exact JSON:
{
  "seedKeyword": "${seedKeyword}",
  "totalKeywords": ${count},
  "marketSummary": "2-3 sentence market overview in ${langLabel}",
  "clusters": [
    {
      "clusterName": "Cluster name in ${langLabel}",
      "intent": "informational|navigational|transactional|commercial",
      "keywords": [
        {
          "keyword": "exact keyword in ${langLabel}",
          "searchVolume": "1K-10K",
          "difficulty": 45,
          "cpc": "0.50",
          "trend": "rising|stable|declining",
          "intent": "informational|navigational|transactional|commercial",
          "isLongTail": true,
          "priority": "high|medium|low"
        }
      ]
    }
  ],
  "questionKeywords": [
    { "question": "question in ${langLabel}?", "searchVolume": "100-1K", "difficulty": 30 }
  ],
  "longtailOpportunities": [
    { "keyword": "long tail phrase", "searchVolume": "100-1K", "difficulty": 25, "reason": "Why this is a good opportunity" }
  ],
  "seasonalTrends": [
    { "keyword": "keyword", "peakMonths": ["Jan","Feb"], "note": "seasonal note" }
  ],
  "negativeKeywords": ["negative keyword 1", "negative keyword 2"],
  "competitorKeywords": ["keyword competitors likely rank for 1", "keyword 2"],
  "contentIdeas": [
    { "title": "Content piece title in ${langLabel}", "type": "article|guide|video|infographic|tool", "targetKeywords": ["kw1","kw2"], "estimatedTraffic": "low|medium|high" }
  ],
  "topKeywordsByPriority": ["top kw 1", "top kw 2", "top kw 3", "top kw 4", "top kw 5"]
}`;

    const result = await callAiJson(ai, systemPrompt, userPrompt, { maxTokens: 10000 });
    const r = result as Record<string, unknown>;
    if (!Array.isArray(r.clusters)) r.clusters = [];
    if (!Array.isArray(r.questionKeywords)) r.questionKeywords = [];
    if (!Array.isArray(r.longtailOpportunities)) r.longtailOpportunities = [];
    if (!Array.isArray(r.contentIdeas)) r.contentIdeas = [];
    if (!Array.isArray(r.topKeywordsByPriority)) r.topKeywordsByPriority = [];

    res.json(result);
  } catch (err: unknown) {
    req.log.error({ err }, "Keyword research failed");
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `فشل بحث الكلمات المفتاحية: ${msg}` });
  }
});

export default router;
