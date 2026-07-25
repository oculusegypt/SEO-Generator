---
name: SEO Provider Integration Lessons
description: Key lessons from wiring AI providers (Qwen, Gemini, Zhipu) into the SEO generator API server.
---

## Path resolution for attached_assets

`process.cwd()` inside `node dist/index.mjs` (run from `artifacts/api-server/`) resolves to `artifacts/api-server/`, NOT the workspace root. The `attached_assets/` directory lives at workspace root.

**Fix used**: `fileURLToPath(import.meta.url)` in the bundled ESM file resolves to `artifacts/api-server/dist/index.mjs`, so going up 3 levels (`join(__dirname, "..", "..", "..")`) reaches the workspace root.

**How to apply**: Any server code that reads workspace-root files must use `import.meta.url`-based resolution, not `process.cwd()`.

---

## Qwen workspace endpoint: free quota exhausted

The Qwen workspace (`ws-twcxat39x22mi7rg.ap-southeast-1.maas.aliyuncs.com`) has a "use free tier only" mode. When the free quota for a model is exhausted, it returns `403 insufficient_quota`.

**Fix**: The user must either add billing in the Alibaba Cloud console OR disable "use free tier only" mode. This cannot be fixed in code.

**The correct API key** for this workspace is in `attached_assets/Pasted--qwen3-5...txt` (lines 84-88). If `data/settings.json` stores a different key, it overrides the imported one — clear the stored key so the imported one takes effect.

---

## jsonLd escaping issue with non-OpenAI models

Non-OpenAI models (Zhipu GLM-4, Qwen) return `jsonLd` as an unescaped JSON object embedded in the outer JSON, breaking `JSON.parse`. Example:

```json
"jsonLd": {"@context":"https://schema.org",...}  // ← object, not string
```

**Fix**: 
1. Prompt the model to return `jsonLd` as a plain object (no stringification).
2. Server-side normalize: if `typeof jsonLd === "object"`, call `JSON.stringify(jsonLd)` before returning.
3. Use `jsonrepair` as a fallback for other JSON corruption.

**How to apply**: Any endpoint that asks LLMs to produce nested JSON-as-string fields should use the object-then-stringify pattern.

---

## Gemini OpenAI-compat model names

`gemini-2.5-flash` returns `404` via the OpenAI-compat endpoint (`generativelanguage.googleapis.com/v1beta/openai/`). Use `gemini-2.0-flash` for a stable model. Preview models need their full versioned ID.

---

## Settings priority in loadConfig

`data/settings.json` key fields override the imported `attached_assets` key. To use the imported key, the `data/settings.json` entry for that provider must not have a `key` field (leave it absent or empty).
