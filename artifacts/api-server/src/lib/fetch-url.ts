/**
 * Fetches a URL and extracts structured SEO-relevant page data using cheerio.
 */
import * as cheerio from "cheerio";

export interface PageData {
  url:                string;
  finalUrl:           string;
  statusCode:         number;
  title:              string;
  metaDescription:    string;
  metaKeywords:       string;
  h1:                 string[];
  h2:                 string[];
  h3:                 string[];
  canonical:          string;
  ogTitle:            string;
  ogDescription:      string;
  ogImage:            string;
  twitterTitle:       string;
  twitterDescription: string;
  lang:               string;
  robots:             string;
  viewport:           string;
  wordCount:          number;
  internalLinks:      number;
  externalLinks:      number;
  imageCount:         number;
  imagesWithoutAlt:   number;
  hasSchema:          boolean;
  schemaTypes:        string[];
  headings:           { level: string; text: string }[];
  bodyText:           string; // truncated to 5000 chars for AI analysis
  loadTimeMs:         number;
}

export async function fetchPageData(rawUrl: string): Promise<PageData> {
  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
  const start = Date.now();

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SEOBot/2.0; +https://seo-tool.com/bot)",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "ar,en;q=0.9",
    },
    signal: AbortSignal.timeout(15_000),
    redirect: "follow",
  });

  const loadTimeMs = Date.now() - start;
  const html       = await res.text();
  const $          = cheerio.load(html);

  /* ── Meta helpers ── */
  const meta = (name: string) =>
    $(`meta[name="${name}"]`).attr("content") ||
    $(`meta[property="${name}"]`).attr("content") || "";

  /* ── Headings ── */
  const headings: { level: string; text: string }[] = [];
  $("h1,h2,h3,h4,h5,h6").each((_, el) => {
    headings.push({ level: el.tagName.toUpperCase(), text: $(el).text().trim() });
  });

  const h1 = headings.filter(h => h.level === "H1").map(h => h.text);
  const h2 = headings.filter(h => h.level === "H2").map(h => h.text).slice(0, 10);
  const h3 = headings.filter(h => h.level === "H3").map(h => h.text).slice(0, 10);

  /* ── Links ── */
  const base = new URL(res.url ?? url).hostname;
  let internalLinks = 0; let externalLinks = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (href.startsWith("#") || href.startsWith("javascript")) return;
    if (href.startsWith("http")) {
      try { new URL(href).hostname === base ? internalLinks++ : externalLinks++; }
      catch { /* skip */ }
    } else { internalLinks++; }
  });

  /* ── Images ── */
  const imgs = $("img");
  const imageCount = imgs.length;
  const imagesWithoutAlt = imgs.filter((_, el) => !$(el).attr("alt")).length;

  /* ── Schema ── */
  const schemaTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() ?? "");
      const t = (data as { "@type"?: string })["@type"];
      if (t) schemaTypes.push(t);
    } catch { /* skip */ }
  });

  /* ── Body text ── */
  $("script,style,nav,header,footer,aside,noscript").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 5000);
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  return {
    url,
    finalUrl:           res.url ?? url,
    statusCode:         res.status,
    title:              $("title").first().text().trim(),
    metaDescription:    meta("description"),
    metaKeywords:       meta("keywords"),
    h1, h2, h3,
    canonical:          $('link[rel="canonical"]').attr("href") ?? "",
    ogTitle:            meta("og:title"),
    ogDescription:      meta("og:description"),
    ogImage:            meta("og:image"),
    twitterTitle:       meta("twitter:title"),
    twitterDescription: meta("twitter:description"),
    lang:               $("html").attr("lang") ?? "",
    robots:             meta("robots"),
    viewport:           meta("viewport"),
    wordCount,
    internalLinks,
    externalLinks,
    imageCount,
    imagesWithoutAlt,
    hasSchema:   schemaTypes.length > 0,
    schemaTypes: [...new Set(schemaTypes)],
    headings:    headings.slice(0, 30),
    bodyText,
    loadTimeMs,
  };
}
