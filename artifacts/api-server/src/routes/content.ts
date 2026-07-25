/**
 * Content routes:
 *  POST /api/content/score  — score & optimize existing content
 *  POST /api/content/article — generate a full SEO article
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

/* ─── POST /api/content/score ─── */
const ScoreBody = z.object({
  content:       z.string().min(50).max(20000),
  targetKeyword: z.string().min(1).max(200),
  language:      z.enum(["ar","en"]).default("ar"),
  provider:      z.enum(["openai","gemini","qwen","zhipu"]).default("zhipu"),
  url:           z.string().optional(),
});

router.post("/content/score", async (req, res) => {
  const parsed = ScoreBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات غير صالحة" }); return; }
  const { content, targetKeyword, language, provider, url } = parsed.data;

  const cfg = loadConfig();
  if (!checkKey(provider, cfg)) { res.status(400).json({ error: `مفتاح ${provider} غير مضبوط` }); return; }

  try {
    const ai = getAiClient(provider);
    const langLabel = language === "ar" ? "Arabic" : "English";
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const keywordOccurrences = (content.toLowerCase().match(new RegExp(targetKeyword.toLowerCase(), "g")) ?? []).length;
    const density = wordCount > 0 ? ((keywordOccurrences / wordCount) * 100).toFixed(2) : "0";

    const systemPrompt = `You are an advanced NLP-powered SEO content analyst. Analyze the provided content and give a comprehensive SEO score with actionable improvements. All text in ${langLabel}. Return only valid JSON.`;

    const userPrompt = `Analyze this content for SEO optimization:

TARGET KEYWORD: "${targetKeyword}"
LANGUAGE: ${langLabel}
URL: ${url ?? "not provided"}
WORD COUNT: ${wordCount}
KEYWORD OCCURRENCES: ${keywordOccurrences} (density: ${density}%)

CONTENT:
${content.slice(0, 8000)}

Return this exact JSON:
{
  "overallScore": 72,
  "grade": "B",
  "scores": {
    "keywordOptimization": 75,
    "readability": 80,
    "contentDepth": 65,
    "structureOrganization": 70,
    "eeat": 55,
    "uniqueness": 80
  },
  "keywordAnalysis": {
    "targetKeyword": "${targetKeyword}",
    "occurrences": ${keywordOccurrences},
    "density": "${density}%",
    "densityAssessment": "optimal|too-low|too-high",
    "inTitle": false,
    "inFirstParagraph": false,
    "inHeadings": false,
    "recommendations": ["Recommendation 1 in ${langLabel}", "Recommendation 2"]
  },
  "readabilityAnalysis": {
    "score": 70,
    "avgSentenceLength": "estimated",
    "avgParagraphLength": "estimated",
    "passiveVoiceEstimate": "low|medium|high",
    "issues": ["Readability issue 1", "Issue 2"],
    "improvements": ["Improvement 1", "Improvement 2"]
  },
  "structureAnalysis": {
    "hasH1": false,
    "headingHierarchy": "good|needs-work",
    "paragraphCount": 0,
    "bulletPointsUsed": false,
    "issues": ["Structure issue 1"],
    "improvements": ["Add H2 headings every 300 words"]
  },
  "contentGaps": [
    { "topic": "Missing topic in ${langLabel}", "reason": "Why it should be included", "priority": "high|medium|low" }
  ],
  "missingElements": ["element 1", "element 2"],
  "optimizedVersion": {
    "openingParagraph": "Rewritten first paragraph (150 words) optimized for the target keyword in ${langLabel}",
    "suggestedH2s": ["Optimized H2 1 in ${langLabel}", "Optimized H2 2", "Optimized H2 3"],
    "metaTitle": "Optimized title tag with keyword (50-60 chars) in ${langLabel}",
    "metaDescription": "Optimized meta description with CTA (150-160 chars) in ${langLabel}"
  },
  "quickWins": ["Quick win 1 in ${langLabel}", "Quick win 2", "Quick win 3"],
  "semanticKeywords": ["semantic kw 1", "semantic kw 2", "semantic kw 3", "kw 4", "kw 5"]
}`;

    const result = await callAiJson(ai, systemPrompt, userPrompt);
    const r = result as Record<string, unknown>;
    if (!Array.isArray(r.contentGaps)) r.contentGaps = [];
    if (!Array.isArray(r.missingElements)) r.missingElements = [];
    if (!Array.isArray(r.quickWins)) r.quickWins = [];
    if (!Array.isArray(r.semanticKeywords)) r.semanticKeywords = [];

    res.json({ ...result, wordCount, keywordOccurrences, density });
  } catch (err: unknown) {
    req.log.error({ err }, "Content score failed");
    res.status(500).json({ error: "فشل تحليل المحتوى" });
  }
});

/* ─── POST /api/content/article ─── */
const ArticleBody = z.object({
  title:          z.string().min(5).max(300),
  targetKeyword:  z.string().min(1).max(200),
  language:       z.enum(["ar","en"]).default("ar"),
  provider:       z.enum(["openai","gemini","qwen","zhipu"]).default("zhipu"),
  tone:           z.enum(["professional","friendly","persuasive"]).default("professional"),
  wordCount:      z.number().int().min(300).max(3000).default(1200),
  outline:        z.array(z.string()).optional(),
  businessType:   z.string().default("general"),
  targetAudience: z.string().default(""),
  internalLinks:  z.array(z.string()).optional(),
  faqItems:       z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
});

router.post("/content/article", async (req, res) => {
  const parsed = ArticleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات غير صالحة" }); return; }
  const { title, targetKeyword, language, provider, tone, wordCount, outline, businessType, targetAudience, internalLinks, faqItems } = parsed.data;

  const cfg = loadConfig();
  if (!checkKey(provider, cfg)) { res.status(400).json({ error: `مفتاح ${provider} غير مضبوط` }); return; }

  try {
    const ai = getAiClient(provider);
    const langLabel = language === "ar" ? "Arabic" : "English";
    const dir = language === "ar" ? "RTL (right-to-left)" : "LTR";
    const toneMap = { professional: "formal and authoritative", friendly: "conversational and approachable", persuasive: "persuasive and action-oriented" };
    const toneDesc = toneMap[tone];

    const systemPrompt = `You are an elite SEO content writer specializing in ${langLabel} content for ${businessType} businesses. Write high-quality, SEO-optimized articles that rank on Google. 
Text direction: ${dir}
Tone: ${toneDesc}
Return only valid JSON with the article.`;

    const outlineSection = outline?.length ? `\nCONTENT OUTLINE:\n${outline.map((h,i) => `${i+1}. ${h}`).join("\n")}` : "";
    const faqSection = faqItems?.length ? `\nFAQ TO INCLUDE:\n${faqItems.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}` : "";
    const linksSection = internalLinks?.length ? `\nINTERNAL LINKS TO MENTION:\n${internalLinks.join(", ")}` : "";
    const audienceSection = targetAudience ? `\nTARGET AUDIENCE: ${targetAudience}` : "";

    const userPrompt = `Write a complete, SEO-optimized article in ${langLabel}:

TITLE: ${title}
TARGET KEYWORD: "${targetKeyword}"
WORD COUNT: ~${wordCount} words
BUSINESS TYPE: ${businessType}${audienceSection}${outlineSection}${faqSection}${linksSection}

CRITICAL RULES:
1. Include the target keyword naturally in: title, first paragraph, 2-3 H2s, conclusion
2. Use proper heading hierarchy (H1 > H2 > H3)
3. Write in ${langLabel} throughout
4. Include keyword density of 1-2%
5. Write for humans first, search engines second
6. Include a compelling introduction and strong CTA in conclusion

Return this exact JSON:
{
  "title": "Final H1 title with keyword",
  "slug": "url-slug-latin",
  "metaTitle": "SEO title tag 50-60 chars",
  "metaDescription": "Meta description with CTA 150-160 chars",
  "wordCount": ${wordCount},
  "estimatedReadTime": "X min read",
  "keywordDensity": "1.5%",
  "article": "Full article in MARKDOWN format with # H1, ## H2, ### H3, **bold**, proper paragraphs. Write the COMPLETE article, not a template.",
  "tableOfContents": ["Section 1", "Section 2"],
  "semanticKeywords": ["kw1","kw2","kw3","kw4","kw5"],
  "internalLinkOpportunities": ["anchor text → target page"],
  "socialSnippets": {
    "twitter": "Tweet-ready version (280 chars)",
    "linkedin": "LinkedIn post intro (150 chars)",
    "facebook": "Facebook post (200 chars)"
  },
  "faqSchema": [{ "question": "Q?", "answer": "A." }]
}`;

    const result = await callAiJson(ai, systemPrompt, userPrompt, { maxTokens: 12000, temperature: 0.7 });
    const r = result as Record<string, unknown>;
    if (!Array.isArray(r.tableOfContents)) r.tableOfContents = [];
    if (!Array.isArray(r.semanticKeywords)) r.semanticKeywords = [];
    if (!Array.isArray(r.faqSchema)) r.faqSchema = [];

    res.json(result);
  } catch (err: unknown) {
    req.log.error({ err }, "Article generation failed");
    res.status(500).json({ error: "فشل توليد المقالة" });
  }
});

export default router;
