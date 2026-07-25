/**
 * Shared AI utility — provider factory + JSON extraction + calling helper.
 * Keeps individual route files lean.
 */
import OpenAI from "openai";
import { jsonrepair } from "jsonrepair";
import { loadConfig, resolveKey } from "../routes/settings.js";
import { IMPORTED_QWEN_DEFAULT_MODEL } from "./imported-provider-config.js";

export interface AiClient { client: OpenAI; model: string; provider: string }

export function getAiClient(provider: string = "zhipu"): AiClient {
  const cfg = loadConfig();
  switch (provider) {
    case "gemini": {
      const key   = resolveKey(cfg.gemini?.key, "GEMINI_API_KEY") ?? "";
      const model = cfg.gemini?.model || "gemini-2.0-flash";
      return { provider, model, client: new OpenAI({ apiKey: key, baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/" }) };
    }
    case "qwen": {
      const key  = resolveKey(cfg.qwen?.key, "QWEN_API_KEY") ?? "";
      const host = cfg.qwen?.host || process.env.QWEN_API_HOST || "ws-twcxat39x22mi7rg.ap-southeast-1.maas.aliyuncs.com";
      const model = cfg.qwen?.model || IMPORTED_QWEN_DEFAULT_MODEL;
      return { provider, model, client: new OpenAI({ apiKey: key, baseURL: `https://${host}/compatible-mode/v1` }) };
    }
    case "zhipu": {
      const key   = resolveKey(cfg.zhipu?.key, "ZHIPU_API_KEY") ?? "";
      const model = cfg.zhipu?.model || "glm-4-flash";
      return { provider, model, client: new OpenAI({ apiKey: key, baseURL: "https://open.bigmodel.cn/api/paas/v4/" }) };
    }
    default: {
      const key   = resolveKey(cfg.openai?.key, "OPENAI_API_KEY") ?? "";
      const model = cfg.openai?.model || "gpt-4o-mini";
      return { provider: "openai", model, client: new OpenAI({ apiKey: key }) };
    }
  }
}

export function extractJson(raw: string): string {
  const noThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fenced  = noThink.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = noThink.indexOf("{");
  const end   = noThink.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return noThink.slice(start, end + 1);
  return noThink.trim();
}

export function normalizeJsonLd(result: Record<string, unknown>): void {
  if (Array.isArray(result.schemaMarkups)) {
    result.schemaMarkups = (result.schemaMarkups as Array<Record<string, unknown>>).map((s) => {
      if (s.jsonLd && typeof s.jsonLd === "object") return { ...s, jsonLd: JSON.stringify(s.jsonLd) };
      return s;
    });
  }
}

export async function callAiJson<T = Record<string, unknown>>(
  { client, model, provider }: AiClient,
  systemPrompt: string,
  userPrompt: string,
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<T> {
  const useJsonMode = provider === "openai";
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ],
    temperature: opts.temperature ?? 0.65,
    max_tokens:  opts.maxTokens  ?? 8000,
    ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
  });
  const content = completion.choices[0]?.message?.content ?? "";
  const jsonStr = extractJson(content);
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return JSON.parse(jsonrepair(jsonStr)) as T;
  }
}
