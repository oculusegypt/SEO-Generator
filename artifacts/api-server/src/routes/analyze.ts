/**
 * URL Analyzer route — fetches any page and runs a full AI-powered SEO audit.
 * Also handles competitor comparison.
 */
import { Router, type IRouter } from "express";
import { z } from "zod";
import { fetchPageData }   from "../lib/fetch-url.js";
import { getAiClient, callAiJson } from "../lib/ai.js";
import { loadConfig, resolveKey }  from "./settings.js";

const router: IRouter = Router();

const AnalyzeBody = z.object({
  url:      z.string().url(),
  provider: z.enum(["openai","gemini","qwen","zhipu"]).default("zhipu"),
  language: z.string().default("ar"),
});

const CompareBody = z.object({
  yourUrl:      z.string().url(),
  competitorUrl: z.string().url(),
  provider:     z.enum(["openai","gemini","qwen","zhipu"]).default("zhipu"),
  language:     z.string().default("ar"),
});

/* ─── POST /api/analyze/url ─── */
router.post("/analyze/url", async (req, res) => {
  const parsed = AnalyzeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "رابط غير صالح" }); return;
  }
  const { url, provider, language } = parsed.data;

  // Check key
  const cfg = loadConfig();
  const keyMap: Record<string,string> = { gemini:"GEMINI_API_KEY", qwen:"QWEN_API_KEY", zhipu:"ZHIPU_API_KEY", openai:"OPENAI_API_KEY" };
  const cfgKey = cfg[provider as keyof typeof cfg] as { key?: string } | undefined;
  const key = resolveKey(cfgKey?.key, keyMap[provider]);
  if (!key) { res.status(400).json({ error: `مفتاح ${provider} غير مضبوط` }); return; }

  try {
    req.log.info({ url }, "Fetching page data");
    const pageData = await fetchPageData(url);
    const ai = getAiClient(provider);
    const langLabel = language === "ar" ? "Arabic" : "English";

    const systemPrompt = `You are a world-class SEO auditor with deep expertise in Google 2026 ranking factors, Core Web Vitals, E-E-A-T, and technical SEO. Analyze the provided page data and return a JSON audit report. Be precise, actionable, and data-driven. All text in ${langLabel}.`;

    const userPrompt = `Analyze this page for SEO and return ONLY valid JSON (no markdown):
URL: ${pageData.finalUrl}
Title: ${pageData.title} (${pageData.title.length} chars)
Meta Description: ${pageData.metaDescription} (${pageData.metaDescription.length} chars)
H1 tags: ${JSON.stringify(pageData.h1)}
H2 tags: ${JSON.stringify(pageData.h2)}
H3 tags: ${JSON.stringify(pageData.h3)}
Word count: ${pageData.wordCount}
Internal links: ${pageData.internalLinks}, External links: ${pageData.externalLinks}
Images: ${pageData.imageCount} total, ${pageData.imagesWithoutAlt} without alt
Schema types: ${JSON.stringify(pageData.schemaTypes)}
Canonical: ${pageData.canonical}
Lang attribute: ${pageData.lang}
Robots: ${pageData.robots}
Load time: ${pageData.loadTimeMs}ms
Content snippet: ${pageData.bodyText.slice(0, 2000)}

Return this exact JSON structure:
{
  "overallScore": 75,
  "grade": "B+",
  "summary": "2-3 sentence executive summary in ${langLabel}",
  "scores": {
    "onPage": 80,
    "technical": 70,
    "content": 75,
    "userExperience": 65,
    "eeat": 60
  },
  "criticalIssues": [
    { "issue": "Issue title", "impact": "high|medium|low", "fix": "How to fix it", "category": "on-page|technical|content|ux" }
  ],
  "opportunities": [
    { "opportunity": "Opportunity title", "potentialImpact": "high|medium|low", "effort": "low|medium|high", "description": "Details" }
  ],
  "titleAnalysis": { "current": "${pageData.title}", "length": ${pageData.title.length}, "assessment": "good|too-short|too-long|missing-keyword", "suggestion": "Improved title" },
  "metaAnalysis": { "current": "${pageData.metaDescription}", "length": ${pageData.metaDescription.length}, "assessment": "good|too-short|too-long|missing-cta", "suggestion": "Improved meta description" },
  "contentAnalysis": { "wordCount": ${pageData.wordCount}, "recommendation": "ideal|too-short|too-long", "suggestedWordCount": 1500, "readabilityScore": 70, "keywordDensity": "estimated %", "contentGaps": ["gap 1", "gap 2"] },
  "technicalChecklist": [
    { "item": "Title tag present and optimized", "status": "pass|fail|warning", "priority": "critical|high|medium|low" }
  ],
  "schemaOpportunities": ["Schema type to add 1", "Schema type 2"],
  "quickWins": ["Quick win action 1", "Quick win action 2", "Quick win action 3"],
  "improvedTitle": "Optimized page title (50-60 chars)",
  "improvedMeta": "Optimized meta description (150-160 chars)",
  "targetKeywords": ["primary kw", "secondary kw", "longtail kw"]
}`;

    const analysis = await callAiJson(ai, systemPrompt, userPrompt);

    // Normalize arrays
    const r = analysis as Record<string, unknown>;
    if (!Array.isArray(r.criticalIssues)) r.criticalIssues = [];
    if (!Array.isArray(r.opportunities)) r.opportunities = [];
    if (!Array.isArray(r.technicalChecklist)) r.technicalChecklist = [];
    if (!Array.isArray(r.quickWins)) r.quickWins = [];
    if (!Array.isArray(r.schemaOpportunities)) r.schemaOpportunities = [];
    if (!Array.isArray(r.targetKeywords)) r.targetKeywords = [];

    res.json({ pageData: { ...pageData, bodyText: undefined }, analysis });
  } catch (err: unknown) {
    req.log.error({ err }, "URL analysis failed");
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `فشل تحليل الصفحة: ${msg}` });
  }
});

/* ─── POST /api/analyze/compare ─── */
router.post("/analyze/compare", async (req, res) => {
  const parsed = CompareBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات غير صالحة" }); return; }
  const { yourUrl, competitorUrl, provider, language } = parsed.data;

  try {
    const [yourPage, compPage] = await Promise.all([
      fetchPageData(yourUrl),
      fetchPageData(competitorUrl),
    ]);
    const ai = getAiClient(provider);
    const langLabel = language === "ar" ? "Arabic" : "English";

    const systemPrompt = `You are an SEO competitive intelligence expert. Compare two pages and identify gaps and opportunities. All text in ${langLabel}. Return only valid JSON.`;

    const userPrompt = `Compare these two pages and return competitive analysis JSON:

YOUR PAGE:
URL: ${yourPage.finalUrl}
Title: ${yourPage.title} (${yourPage.title.length} chars)
Meta: ${yourPage.metaDescription}
H1: ${JSON.stringify(yourPage.h1)}
H2: ${JSON.stringify(yourPage.h2)}
Words: ${yourPage.wordCount}
Internal links: ${yourPage.internalLinks}
Images: ${yourPage.imageCount} (${yourPage.imagesWithoutAlt} no alt)
Schema: ${JSON.stringify(yourPage.schemaTypes)}

COMPETITOR PAGE:
URL: ${compPage.finalUrl}
Title: ${compPage.title} (${compPage.title.length} chars)
Meta: ${compPage.metaDescription}
H1: ${JSON.stringify(compPage.h1)}
H2: ${JSON.stringify(compPage.h2)}
Words: ${compPage.wordCount}
Internal links: ${compPage.internalLinks}
Images: ${compPage.imageCount} (${compPage.imagesWithoutAlt} no alt)
Schema: ${JSON.stringify(compPage.schemaTypes)}

Return this exact JSON:
{
  "winner": "yours|competitor|tie",
  "yourScore": 72,
  "competitorScore": 85,
  "summary": "Executive summary of comparison in ${langLabel}",
  "metrics": [
    { "metric": "Title Length", "yours": "${yourPage.title.length} chars", "competitor": "${compPage.title.length} chars", "winner": "yours|competitor|tie", "importance": "high" }
  ],
  "competitorAdvantages": [{ "area": "Content depth", "detail": "explanation", "howToClose": "action" }],
  "yourAdvantages": [{ "area": "Schema markup", "detail": "explanation" }],
  "actionPlan": [
    { "priority": 1, "action": "Specific action to outrank competitor", "effort": "low|medium|high", "impact": "high|medium|low" }
  ],
  "contentGaps": ["Topic competitor covers that you don't 1", "Topic 2"],
  "keywordOpportunities": ["Keyword to target 1", "Keyword 2"],
  "quickWins": ["Quick action 1", "Quick action 2"]
}`;

    const comparison = await callAiJson(ai, systemPrompt, userPrompt);
    res.json({ yourPage: { ...yourPage, bodyText: undefined }, compPage: { ...compPage, bodyText: undefined }, comparison });
  } catch (err: unknown) {
    req.log.error({ err }, "Comparison failed");
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `فشل التحليل المقارن: ${msg}` });
  }
});

export default router;
