import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { GenerateSeoBody } from "@workspace/api-zod";
import { IMPORTED_QWEN_DEFAULT_MODEL } from "../lib/imported-provider-config.js";
import { loadConfig, resolveKey } from "./settings.js";

const router: IRouter = Router();

/* ─── Provider → client factory ─── */
function getProviderClient(provider: string): { client: OpenAI; model: string } {
  const cfg = loadConfig();

  switch (provider) {
    case "gemini": {
      const key   = resolveKey(cfg.gemini?.key, "GEMINI_API_KEY") ?? "";
      const model = cfg.gemini?.model || "gemini-2.5-flash";
      return {
        client: new OpenAI({
          apiKey:  key,
          baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        }),
        model,
      };
    }
    case "qwen": {
      const key  = resolveKey(cfg.qwen?.key, "QWEN_API_KEY") ?? "";
      const host = cfg.qwen?.host || process.env.QWEN_API_HOST || "ws-twcxat39x22mi7rg.ap-southeast-1.maas.aliyuncs.com";
      const base = `https://${host}/compatible-mode/v1`;
      const model = cfg.qwen?.model || IMPORTED_QWEN_DEFAULT_MODEL;
      return { client: new OpenAI({ apiKey: key, baseURL: base }), model };
    }
    case "zhipu": {
      const key   = resolveKey(cfg.zhipu?.key, "ZHIPU_API_KEY") ?? "";
      const model = cfg.zhipu?.model || "glm-4-flash";
      return {
        client: new OpenAI({ apiKey: key, baseURL: "https://open.bigmodel.cn/api/paas/v4/" }),
        model,
      };
    }
    default: { // openai
      const key   = resolveKey(cfg.openai?.key, "OPENAI_API_KEY") ?? "";
      const model = cfg.openai?.model || "gpt-4o-mini";
      return { client: new OpenAI({ apiKey: key }), model };
    }
  }
}

function resolveKeyForProvider(provider: string): string | undefined {
  const cfg = loadConfig();
  switch (provider) {
    case "gemini": return resolveKey(cfg.gemini?.key, "GEMINI_API_KEY");
    case "qwen":   return resolveKey(cfg.qwen?.key,   "QWEN_API_KEY");
    case "zhipu":  return resolveKey(cfg.zhipu?.key,  "ZHIPU_API_KEY");
    default:       return resolveKey(cfg.openai?.key,  "OPENAI_API_KEY");
  }
}

function extractJson(raw: string): string {
  // Remove <think>...</think> blocks (Qwen3 thinking models)
  const noThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fenced  = noThink.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = noThink.indexOf("{");
  const end   = noThink.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return noThink.slice(start, end + 1);
  return noThink.trim();
}

/* ─── POST /api/seo/generate ─── */
router.post("/seo/generate", async (req, res) => {
  const parsed = GenerateSeoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: `Invalid request: ${parsed.error.issues.map(i => i.message).join(", ")}` });
    return;
  }

  const {
    serviceName,
    language     = "ar",
    tone         = "professional",
    provider     = "gemini",
    businessType = "local",
    targetAudience = "",
    location       = "",
  } = parsed.data;

  // Check API key
  const apiKey = resolveKeyForProvider(provider);
  if (!apiKey) {
    res.status(400).json({
      error: `مفتاح API للمزود "${provider}" غير مضبوط. اذهب إلى الإعدادات ⚙️ وأضف المفتاح.`,
    });
    return;
  }

  const langLabel = language === "ar" ? "Arabic" : "English";
  const toneLabel = tone === "professional" ? "professional and authoritative"
    : tone === "friendly" ? "friendly and approachable" : "persuasive and compelling";

  const { client, model } = getProviderClient(provider);

  const systemPrompt = `You are a world-class SEO strategist expert in Google 2026 ranking factors, Schema.org structured data, Generative Engine Optimization (GEO), E-E-A-T signals, Core Web Vitals, and technical SEO.

Generate a COMPLETE SEO package for the given service/product.

CRITICAL RULES:
1. Respond ONLY with valid JSON — no markdown fences, no explanations, no <think> blocks.
2. ALL text content MUST be in ${langLabel} language (JSON keys stay in English).
3. Tone: ${toneLabel}.
4. Generate real, actionable content — not templates.
5. JSON must be perfectly parseable.`;

  const today = new Date().toISOString().split("T")[0];

  const userPrompt = `Generate complete SEO package for: "${serviceName}"
Business: ${businessType || "general"} | Audience: ${targetAudience || "general"} | Location: ${location || "unspecified"}
Output language: ${langLabel}

Return ONLY this JSON (all text values in ${langLabel}, no extra fields):
{
  "title": "50-60 char page title with primary keyword",
  "metaDescription": "150-160 char meta description with CTA",
  "keywords": ["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8","kw9","kw10","kw11","kw12"],
  "slogan": "memorable tagline max 10 words",
  "ogTitle": "OG title max 60 chars",
  "ogDescription": "OG description 1-2 sentences",
  "twitterTitle": "twitter title max 70 chars",
  "twitterDescription": "twitter description max 200 chars",
  "canonicalSlug": "url-slug-latin-only",
  "faqItems": [
    {"question": "Q1 in ${langLabel}?","answer": "Detailed answer 40+ words."},
    {"question": "Q2?","answer": "Detailed answer."},
    {"question": "Q3?","answer": "Detailed answer."},
    {"question": "Q4?","answer": "Detailed answer."},
    {"question": "Q5?","answer": "Detailed answer."}
  ],
  "schemaMarkups": [
    {"schemaType": "${businessType === "local" ? "LocalBusiness" : "Service"}","label": "Primary Business Schema","priority": "high","jsonLd": "{\"@context\":\"https://schema.org\",\"@type\":\"${businessType === "local" ? "LocalBusiness" : "Service"}\",\"name\":\"Service name here\",\"description\":\"Brief description\",\"url\":\"https://example.com\"}"},
    {"schemaType": "Organization","label": "Organization Schema","priority": "high","jsonLd": "{\"@context\":\"https://schema.org\",\"@type\":\"Organization\",\"name\":\"Business name\",\"url\":\"https://example.com\",\"logo\":{\"@type\":\"ImageObject\",\"url\":\"https://example.com/logo.png\"}}"},
    {"schemaType": "BreadcrumbList","label": "Breadcrumb","priority": "medium","jsonLd": "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://example.com\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Services\",\"item\":\"https://example.com/services\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"Slug page\",\"item\":\"https://example.com/services/slug\"}]}"},
    {"schemaType": "FAQPage","label": "FAQ Rich Results","priority": "high","jsonLd": "{\"@context\":\"https://schema.org\",\"@type\":\"FAQPage\",\"mainEntity\":[{\"@type\":\"Question\",\"name\":\"FAQ Q1\",\"acceptedAnswer\":{\"@type\":\"Answer\",\"text\":\"FAQ A1\"}}]}"},
    {"schemaType": "WebPage","label": "WebPage","priority": "medium","jsonLd": "{\"@context\":\"https://schema.org\",\"@type\":\"WebPage\",\"name\":\"Page title\",\"dateModified\":\"${today}\",\"inLanguage\":\"${language}\"}"}
  ],
  "geoContent": {
    "directAnswer": "2-3 sentence direct answer optimized for Google AI Overviews in ${langLabel}",
    "featuredSnippet": "40-60 word paragraph for position zero in ${langLabel}",
    "peopleAlsoAsk": [
      {"question": "PAA Q1 in ${langLabel}?","answer": "Concise answer under 40 words."},
      {"question": "PAA Q2?","answer": "Answer."},
      {"question": "PAA Q3?","answer": "Answer."},
      {"question": "PAA Q4?","answer": "Answer."},
      {"question": "PAA Q5?","answer": "Answer."}
    ],
    "voiceSearchQuery": "Natural voice query in ${langLabel}",
    "aiOverviewTips": ["Tip 1 in ${langLabel}","Tip 2","Tip 3","Tip 4"]
  },
  "technicalChecklist": [
    {"category": "On-Page SEO","item": "Keyword in H1","priority": "critical","status": "required","description": "H1 must contain primary keyword"},
    {"category": "On-Page SEO","item": "Internal links to 3-5 related pages","priority": "high","status": "required","description": "Distribute page authority"},
    {"category": "Technical SEO","item": "Canonical tag configured","priority": "critical","status": "required","description": "Prevent duplicate content"},
    {"category": "Technical SEO","item": "Hreflang for Arabic/English","priority": "high","status": "recommended","description": "Critical for bilingual sites"},
    {"category": "Technical SEO","item": "XML Sitemap includes URL","priority": "critical","status": "required","description": "Ensures Googlebot discovery"},
    {"category": "Core Web Vitals","item": "LCP under 2.5 seconds","priority": "critical","status": "required","description": "Google ranking signal"},
    {"category": "Core Web Vitals","item": "INP under 200ms","priority": "critical","status": "required","description": "Replaced FID in 2024"},
    {"category": "Core Web Vitals","item": "CLS under 0.1","priority": "high","status": "required","description": "Visual stability"},
    {"category": "Schema Markup","item": "JSON-LD in page head","priority": "critical","status": "required","description": "Google prefers head placement"},
    {"category": "Schema Markup","item": "Validate with Rich Results tool","priority": "high","status": "required","description": "search.google.com/test/rich-results"},
    {"category": "E-E-A-T","item": "Author bio with credentials","priority": "high","status": "recommended","description": "Demonstrates expertise"},
    {"category": "Mobile SEO","item": "Fully responsive layout","priority": "critical","status": "required","description": "Mobile-first indexing"},
    {"category": "Image SEO","item": "Descriptive alt text on all images","priority": "high","status": "required","description": "Accessibility + ranking"},
    {"category": "Image SEO","item": "WebP/AVIF format","priority": "medium","status": "recommended","description": "Improves LCP score"},
    {"category": "GEO / AI Search","item": "FAQ section with schema","priority": "high","status": "required","description": "Boosts AI Overview inclusion"}
  ],
  "serpPreview": {
    "displayUrl": "example.com › services › slug",
    "breadcrumb": "Home > Services > Service Name",
    "titlePreview": "Title as it appears in Google SERP",
    "descriptionPreview": "Meta description preview ~155 chars shown on desktop",
    "richResultEligible": ["FAQ Rich Result","Breadcrumb","Sitelinks"],
    "estimatedCtr": "8-12% with rich results"
  },
  "contentBrief": {
    "recommendedWordCount": 1500,
    "suggestedH1": "H1 heading in ${langLabel} with main keyword",
    "sections": [
      {"heading": "Introduction heading","headingLevel": "H2","purpose": "Value proposition","wordCount": 200,"keywordsToInclude": ["primary kw"]},
      {"heading": "Benefits heading","headingLevel": "H2","purpose": "Key benefits list","wordCount": 300,"keywordsToInclude": ["benefit kw"]},
      {"heading": "How it works","headingLevel": "H2","purpose": "Process steps","wordCount": 250,"keywordsToInclude": ["process kw"]},
      {"heading": "FAQ heading","headingLevel": "H2","purpose": "FAQ schema content","wordCount": 300,"keywordsToInclude": []}
    ],
    "internalLinkSuggestions": ["related service","about us","pricing","contact"],
    "competitorTopics": ["topic 1 in ${langLabel}","topic 2","topic 3"]
  },
  "eeatSignals": {
    "experienceSignals": ["Experience signal 1 in ${langLabel}","Signal 2","Signal 3"],
    "expertiseSignals": ["Expertise signal 1 in ${langLabel}","Signal 2","Signal 3"],
    "authoritativenessSignals": ["Authority signal 1 in ${langLabel}","Signal 2","Signal 3"],
    "trustSignals": ["Trust signal 1 in ${langLabel}","Signal 2","Signal 3","Signal 4"],
    "overallScore": 70
  },
  "semanticKeywords": [
    {"keyword": "semantic kw 1 in ${langLabel}","intent": "informational","relevanceScore": 90,"isLsi": true},
    {"keyword": "semantic kw 2","intent": "transactional","relevanceScore": 85,"isLsi": false},
    {"keyword": "semantic kw 3","intent": "commercial","relevanceScore": 80,"isLsi": true},
    {"keyword": "semantic kw 4","intent": "navigational","relevanceScore": 75,"isLsi": false},
    {"keyword": "semantic kw 5","intent": "informational","relevanceScore": 70,"isLsi": true},
    {"keyword": "semantic kw 6","intent": "transactional","relevanceScore": 65,"isLsi": false}
  ]
}`;

  try {
    // Only use json_object for providers that reliably support it
    const useJsonMode = provider === "openai";

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
      temperature: 0.65,
      max_tokens:  8000,
      ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "لم يُعَد أي محتوى من المزود" });
      return;
    }

    const jsonStr = extractJson(content);
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch {
      // Last resort: try to salvage by extracting just what we can
      req.log.warn({ provider, snippet: jsonStr.slice(0, 200) }, "JSON parse failed, trying rescue");
      res.status(500).json({ error: "خطأ في تحليل الاستجابة. حاول مرة أخرى أو جرب مزوداً آخر." });
      return;
    }

    // Normalize arrays/objects
    if (!Array.isArray(result.keywords))        result.keywords = [];
    if (!Array.isArray(result.faqItems))         result.faqItems = [];
    if (!Array.isArray(result.schemaMarkups))    result.schemaMarkups = [];
    if (!Array.isArray(result.technicalChecklist)) result.technicalChecklist = [];
    if (!Array.isArray(result.semanticKeywords)) result.semanticKeywords = [];
    if (!result.geoContent)     result.geoContent     = { directAnswer: "", featuredSnippet: "", peopleAlsoAsk: [], voiceSearchQuery: "", aiOverviewTips: [] };
    if (!result.serpPreview)    result.serpPreview     = { displayUrl: "", breadcrumb: "", titlePreview: result.title, descriptionPreview: result.metaDescription, richResultEligible: [], estimatedCtr: "" };
    if (!result.contentBrief)  result.contentBrief    = { recommendedWordCount: 1500, suggestedH1: result.title, sections: [], internalLinkSuggestions: [], competitorTopics: [] };
    if (!result.eeatSignals)   result.eeatSignals     = { experienceSignals: [], expertiseSignals: [], authoritativenessSignals: [], trustSignals: [], overallScore: 50 };

    res.json(result);
  } catch (err: unknown) {
    req.log.error({ err, provider }, "AI provider request failed");
    let message = "خطأ غير متوقع من مزود الذكاء الاصطناعي";
    if (err instanceof Error) {
      const msg = err.message;
      if (msg.includes("429") || msg.includes("quota") || msg.includes("rate"))
        message = `تجاوزت الحد المسموح به لمزود "${provider}". جرب مزوداً آخر أو انتظر قليلاً.`;
      else if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("invalid_api_key"))
        message = `مفتاح API للمزود "${provider}" غير صحيح. تحقق من الإعدادات ⚙️.`;
      else if (msg.includes("404"))
        message = `النموذج غير متاح للمزود "${provider}". غيّر النموذج في الإعدادات ⚙️.`;
      else
        message = msg;
    }
    res.status(500).json({ error: message });
  }
});

export default router;
