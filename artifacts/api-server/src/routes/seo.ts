import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { GenerateSeoBody } from "@workspace/api-zod";

const router: IRouter = Router();

const PROVIDER_KEY_MAP: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  qwen: "QWEN_API_KEY",
  zhipu: "ZHIPU_API_KEY",
};

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
          baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        }),
        model: "qwen-plus",
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
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
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
    businessType = "local",
    targetAudience = "",
    location = "",
  } = parsed.data;

  // Check API key exists for the selected provider
  const envKeyName = PROVIDER_KEY_MAP[provider] ?? "OPENAI_API_KEY";
  if (!process.env[envKeyName]) {
    res.status(400).json({
      error: `مفتاح API للمزود "${provider}" غير مضبوط. يرجى إضافة ${envKeyName} في الإعدادات.`,
    });
    return;
  }

  const langLabel = language === "ar" ? "Arabic" : "English";
  const toneLabel =
    tone === "professional"
      ? "professional and authoritative"
      : tone === "friendly"
        ? "friendly and approachable"
        : "persuasive and compelling";

  const { client, model } = getProviderClient(provider);

  const systemPrompt = `You are a world-class SEO strategist with deep expertise in Google 2026 ranking factors, Schema.org structured data, Generative Engine Optimization (GEO) for Google AI Overviews, E-E-A-T signals, Core Web Vitals, and technical SEO.

Your task is to generate a COMPLETE, REVOLUTIONARY SEO package for a given service/product that will dominate search results in 2026.

CRITICAL RULES:
1. Respond ONLY with valid, parseable JSON — no markdown, no code blocks, no explanations.
2. ALL text content MUST be written in ${langLabel} language (except JSON keys and schema @type values which stay in English).
3. Use a ${toneLabel} tone throughout.
4. Generate REAL, ACTIONABLE content — not generic templates.
5. Make Schema JSON-LD strings valid and complete.`;

  const userPrompt = `Generate a complete 2026 SEO package for: "${serviceName}"
Business type: ${businessType || "general"}
Target audience: ${targetAudience || "general audience"}
Location: ${location || "not specified"}

Return EXACTLY this JSON structure (all text values in ${langLabel}):

{
  "title": "SEO page title, 50-60 chars, primary keyword at start",
  "metaDescription": "Meta description 150-160 chars with emotional hook and CTA",
  "keywords": ["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8","kw9","kw10","kw11","kw12"],
  "slogan": "Powerful memorable tagline max 10 words",
  "ogTitle": "Open Graph title max 60 chars",
  "ogDescription": "OG description 1-2 compelling sentences",
  "twitterTitle": "Twitter card title max 70 chars",
  "twitterDescription": "Twitter card description max 200 chars",
  "canonicalSlug": "url-friendly-slug-latin-only",
  "faqItems": [
    {"question": "Question 1 in ${langLabel}?", "answer": "Detailed answer min 50 words."},
    {"question": "Question 2?", "answer": "Detailed answer."},
    {"question": "Question 3?", "answer": "Detailed answer."},
    {"question": "Question 4?", "answer": "Detailed answer."},
    {"question": "Question 5?", "answer": "Detailed answer."}
  ],
  "schemaMarkups": [
    {
      "schemaType": "${businessType === "local" ? "LocalBusiness" : "Service"}",
      "label": "Primary Schema",
      "priority": "high",
      "jsonLd": "{\"@context\":\"https://schema.org\",\"@type\":\"${businessType === "local" ? "LocalBusiness" : "Service"}\",\"name\":\"[Service Name in ${langLabel}]\",\"description\":\"[Description]\",\"url\":\"https://example.com\",\"telephone\":\"+1234567890\",\"address\":{\"@type\":\"PostalAddress\",\"addressLocality\":\"${location || "City"}\",\"addressCountry\":\"SA\"}}"
    },
    {
      "schemaType": "Organization",
      "label": "Organization Schema",
      "priority": "high",
      "jsonLd": "{\"@context\":\"https://schema.org\",\"@type\":\"Organization\",\"name\":\"[Business Name]\",\"url\":\"https://example.com\",\"logo\":{\"@type\":\"ImageObject\",\"url\":\"https://example.com/logo.png\"},\"sameAs\":[\"https://twitter.com/business\",\"https://facebook.com/business\"],\"contactPoint\":{\"@type\":\"ContactPoint\",\"contactType\":\"customer service\",\"availableLanguage\":[\"${langLabel}\"]}}"
    },
    {
      "schemaType": "BreadcrumbList",
      "label": "Breadcrumb Navigation",
      "priority": "medium",
      "jsonLd": "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"[Home in ${langLabel}]\",\"item\":\"https://example.com\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"[Services in ${langLabel}]\",\"item\":\"https://example.com/services\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"[Page Name]\",\"item\":\"https://example.com/services/slug\"}]}"
    },
    {
      "schemaType": "WebPage",
      "label": "WebPage / Article Schema",
      "priority": "medium",
      "jsonLd": "{\"@context\":\"https://schema.org\",\"@type\":\"WebPage\",\"name\":\"[Page Title]\",\"description\":\"[Meta Description]\",\"url\":\"https://example.com/services/slug\",\"datePublished\":\"2025-01-01\",\"dateModified\":\"${new Date().toISOString().split("T")[0]}\",\"inLanguage\":\"${language}\",\"potentialAction\":{\"@type\":\"ReadAction\",\"target\":\"https://example.com/services/slug\"}}"
    },
    {
      "schemaType": "FAQPage",
      "label": "FAQ Rich Results",
      "priority": "high",
      "jsonLd": "{\"@context\":\"https://schema.org\",\"@type\":\"FAQPage\",\"mainEntity\":[{\"@type\":\"Question\",\"name\":\"[Question 1]\",\"acceptedAnswer\":{\"@type\":\"Answer\",\"text\":\"[Answer 1]\"}},{\"@type\":\"Question\",\"name\":\"[Question 2]\",\"acceptedAnswer\":{\"@type\":\"Answer\",\"text\":\"[Answer 2]\"}}]}"
    }
  ],
  "geoContent": {
    "directAnswer": "A clear, concise 2-3 sentence direct answer about this service optimized for Google AI Overviews. Written in ${langLabel}. Should answer the most common question about this service.",
    "featuredSnippet": "A 40-60 word paragraph that directly answers what this service is and why it matters. Structured to appear in position zero. Written in ${langLabel}.",
    "peopleAlsoAsk": [
      {"question": "PAA question 1 in ${langLabel}?", "answer": "Concise answer under 50 words."},
      {"question": "PAA question 2?", "answer": "Concise answer."},
      {"question": "PAA question 3?", "answer": "Concise answer."},
      {"question": "PAA question 4?", "answer": "Concise answer."},
      {"question": "PAA question 5?", "answer": "Concise answer."}
    ],
    "voiceSearchQuery": "Natural voice search query in ${langLabel} that this page should answer",
    "aiOverviewTips": [
      "Specific tip 1 in ${langLabel} to appear in AI Overviews",
      "Specific tip 2",
      "Specific tip 3",
      "Specific tip 4"
    ]
  },
  "technicalChecklist": [
    {"category": "On-Page SEO", "item": "Primary keyword in H1 tag", "priority": "critical", "status": "required", "description": "The H1 must contain the primary keyword naturally"},
    {"category": "On-Page SEO", "item": "Keyword density 1-2% across content", "priority": "high", "status": "required", "description": "Avoid keyword stuffing while maintaining relevance"},
    {"category": "On-Page SEO", "item": "Internal links to 3-5 related pages", "priority": "high", "status": "required", "description": "Improves crawlability and distributes page authority"},
    {"category": "Technical SEO", "item": "Canonical tag configured correctly", "priority": "critical", "status": "required", "description": "Prevents duplicate content issues"},
    {"category": "Technical SEO", "item": "Hreflang tags for multilingual pages", "priority": "high", "status": "recommended", "description": "Critical for Arabic/English bilingual sites"},
    {"category": "Technical SEO", "item": "XML Sitemap includes this URL", "priority": "critical", "status": "required", "description": "Ensures Googlebot discovers and indexes the page"},
    {"category": "Technical SEO", "item": "Robots.txt allows crawling", "priority": "critical", "status": "required", "description": "Verify page is not accidentally blocked"},
    {"category": "Core Web Vitals", "item": "LCP under 2.5 seconds", "priority": "critical", "status": "required", "description": "Largest Contentful Paint — Google ranking signal 2024-2026"},
    {"category": "Core Web Vitals", "item": "INP under 200 milliseconds", "priority": "critical", "status": "required", "description": "Interaction to Next Paint — replaced FID in 2024"},
    {"category": "Core Web Vitals", "item": "CLS under 0.1", "priority": "high", "status": "required", "description": "Cumulative Layout Shift — visual stability metric"},
    {"category": "Schema Markup", "item": "JSON-LD scripts in <head>", "priority": "critical", "status": "required", "description": "Schema in <head> loads before render — preferred by Google"},
    {"category": "Schema Markup", "item": "Test with Google Rich Results tool", "priority": "high", "status": "required", "description": "Validate at search.google.com/test/rich-results"},
    {"category": "E-E-A-T", "item": "Author bio with credentials", "priority": "high", "status": "recommended", "description": "Demonstrates expertise — critical for YMYL topics"},
    {"category": "E-E-A-T", "item": "Customer reviews / testimonials", "priority": "high", "status": "recommended", "description": "Social proof builds trust signals"},
    {"category": "Mobile SEO", "item": "Fully responsive layout", "priority": "critical", "status": "required", "description": "Google mobile-first indexing — mobile version is primary"},
    {"category": "Image SEO", "item": "All images have descriptive alt text", "priority": "high", "status": "required", "description": "Accessibility + image search ranking factor"},
    {"category": "Image SEO", "item": "Images in WebP or AVIF format", "priority": "medium", "status": "recommended", "description": "Modern formats improve LCP and Core Web Vitals"},
    {"category": "GEO / AI Search", "item": "Content structured with clear answers", "priority": "high", "status": "recommended", "description": "Optimizes for Google AI Overviews and featured snippets"},
    {"category": "GEO / AI Search", "item": "FAQ section with schema markup", "priority": "high", "status": "required", "description": "PAA and FAQ rich results boost AI Overview inclusion"}
  ],
  "serpPreview": {
    "displayUrl": "example.com › services › [canonical-slug]",
    "breadcrumb": "Home > Services > [Service Name in ${langLabel}]",
    "titlePreview": "[Page title — if over 60 chars it gets truncated here...]",
    "descriptionPreview": "[Meta description preview — Google shows ~155 chars on desktop...]",
    "richResultEligible": ["FAQ Rich Result", "Breadcrumb", "Sitelinks"],
    "estimatedCtr": "8-12% (above average with rich results)"
  },
  "contentBrief": {
    "recommendedWordCount": 1500,
    "suggestedH1": "Primary H1 heading in ${langLabel} with main keyword",
    "sections": [
      {"heading": "Section H2 heading in ${langLabel}", "headingLevel": "H2", "purpose": "Introduce the main value proposition", "wordCount": 200, "keywordsToInclude": ["primary keyword", "secondary keyword"]},
      {"heading": "Benefits / Why Choose Us heading", "headingLevel": "H2", "purpose": "List 3-5 key benefits with supporting details", "wordCount": 300, "keywordsToInclude": ["benefit-related keyword"]},
      {"heading": "How It Works heading", "headingLevel": "H2", "purpose": "Explain the process step by step", "wordCount": 250, "keywordsToInclude": ["process keyword"]},
      {"heading": "Service Details heading", "headingLevel": "H2", "purpose": "Deep dive into features and specifications", "wordCount": 350, "keywordsToInclude": ["feature keywords"]},
      {"heading": "Customer Success Stories", "headingLevel": "H2", "purpose": "Social proof and E-E-A-T experience signals", "wordCount": 200, "keywordsToInclude": []},
      {"heading": "Frequently Asked Questions", "headingLevel": "H2", "purpose": "FAQ schema content — answers PAA questions", "wordCount": 300, "keywordsToInclude": ["question keywords"]}
    ],
    "internalLinkSuggestions": ["related service 1", "related service 2", "about us page", "contact page", "pricing page"],
    "competitorTopics": ["topic competitors cover 1 in ${langLabel}", "topic 2", "topic 3"]
  },
  "eeatSignals": {
    "experienceSignals": [
      "Specific experience signal 1 in ${langLabel}",
      "Experience signal 2",
      "Experience signal 3"
    ],
    "expertiseSignals": [
      "Expertise signal 1 in ${langLabel}",
      "Expertise signal 2",
      "Expertise signal 3"
    ],
    "authoritativenessSignals": [
      "Authority signal 1 in ${langLabel}",
      "Authority signal 2",
      "Authority signal 3"
    ],
    "trustSignals": [
      "Trust signal 1 in ${langLabel}",
      "Trust signal 2",
      "Trust signal 3",
      "Trust signal 4"
    ],
    "overallScore": 65
  },
  "semanticKeywords": [
    {"keyword": "semantic keyword 1 in ${langLabel}", "intent": "informational", "relevanceScore": 95, "isLsi": true},
    {"keyword": "semantic keyword 2", "intent": "transactional", "relevanceScore": 90, "isLsi": false},
    {"keyword": "semantic keyword 3", "intent": "commercial", "relevanceScore": 85, "isLsi": true},
    {"keyword": "semantic keyword 4", "intent": "navigational", "relevanceScore": 80, "isLsi": false},
    {"keyword": "semantic keyword 5", "intent": "informational", "relevanceScore": 78, "isLsi": true},
    {"keyword": "semantic keyword 6", "intent": "transactional", "relevanceScore": 75, "isLsi": false},
    {"keyword": "semantic keyword 7", "intent": "commercial", "relevanceScore": 72, "isLsi": true},
    {"keyword": "semantic keyword 8", "intent": "informational", "relevanceScore": 70, "isLsi": false}
  ]
}`;

  try {
    const useJsonFormat = provider === "openai" || provider === "gemini";

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

    // Normalize arrays
    if (!Array.isArray(result.keywords)) result.keywords = [];
    if (!Array.isArray(result.faqItems)) result.faqItems = [];
    if (!Array.isArray(result.schemaMarkups)) result.schemaMarkups = [];
    if (!Array.isArray(result.technicalChecklist)) result.technicalChecklist = [];
    if (!result.geoContent) result.geoContent = { directAnswer: "", featuredSnippet: "", peopleAlsoAsk: [], voiceSearchQuery: "", aiOverviewTips: [] };
    if (!result.serpPreview) result.serpPreview = { displayUrl: "", breadcrumb: "", titlePreview: result.title, descriptionPreview: result.metaDescription, richResultEligible: [], estimatedCtr: "" };
    if (!result.contentBrief) result.contentBrief = { recommendedWordCount: 1500, suggestedH1: result.title, sections: [], internalLinkSuggestions: [], competitorTopics: [] };
    if (!result.eeatSignals) result.eeatSignals = { experienceSignals: [], expertiseSignals: [], authoritativenessSignals: [], trustSignals: [], overallScore: 50 };
    if (!Array.isArray(result.semanticKeywords)) result.semanticKeywords = [];

    res.json(result);
  } catch (err: unknown) {
    req.log.error({ err, provider }, "AI provider request failed");

    let message = "خطأ غير متوقع";
    if (err instanceof Error) {
      if (err.message.includes("quota") || err.message.includes("429")) {
        message = `تجاوزت حصة مفتاح ${provider}. جرب مزوداً آخر.`;
      } else if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        message = `مفتاح API للمزود "${provider}" غير صحيح أو منتهي.`;
      } else if (err.message.includes("model") || err.message.includes("404")) {
        message = `النموذج المطلوب غير متاح للمزود "${provider}". جرب مزوداً آخر.`;
      } else if (err.message.includes("JSON") || err.message.includes("parse")) {
        message = `خطأ في تحليل الاستجابة. يرجى المحاولة مرة أخرى.`;
      } else {
        message = err.message;
      }
    }

    res.status(500).json({ error: message });
  }
});

export default router;
