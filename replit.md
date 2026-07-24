# مركز SEO 2026 — Revolutionary SEO Platform

منصة توليد SEO ثورية متوافقة مع معايير Google 2026، تجمع أحدث تقنيات السيو والسكيما والأرشفة.

## Run & Operate

- Replit workflow: `SEO Generator` — starts the frontend and API together for the preview
- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `PORT=18531 BASE_PATH=/ pnpm --filter @workspace/seo-generator run dev` — Frontend (port 18531)
- The combined workflow uses API port `8080` and frontend port `18531`; the frontend is served at `/` and the API at `/api`
- `pnpm run typecheck` — full typecheck
- `pnpm run build` — typecheck + build
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks & Zod schemas from OpenAPI spec
- After any OpenAPI change: run codegen before editing frontend

### Replit setup status

- Dependencies install with `pnpm install --frozen-lockfile`
- API build passes and `/api/healthz` responds with `{"status":"ok"}`
- Frontend production build passes with `PORT=18531 BASE_PATH=/`
- The imported frontend currently has pre-existing strict TypeScript errors in Framer Motion animation definitions and localized text literals; these do not prevent the Vite runtime or production build

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Pino logging
- Frontend: React 19 + Vite 7 + Tailwind + shadcn/ui
- AI: OpenAI-compatible SDK → GPT-4o-mini / Gemini 2.0 Flash / Qwen Plus / Zhipu GLM-4
- Validation: Zod v4 + Orval codegen

## Features — SEO Package Generated per Query

1. **Core SEO** — Title (50-60c), Meta Description (150-160c), Canonical Slug, Slogan
2. **Keywords** — 12 primary + semantic/LSI with intent classification (informational/transactional/commercial/navigational)
3. **Social** — Open Graph + Twitter/X Card tags
4. **Schema Markup (JSON-LD)** — 5 schema types: LocalBusiness/Service, Organization, BreadcrumbList, WebPage, FAQPage
5. **FAQ Schema** — 5 questions with full JSON-LD export
6. **GEO (Generative Engine Optimization)** — Direct Answer for AI Overviews, Featured Snippet (Position Zero), People Also Ask (5 PAA), Voice Search Query, AI Overview Tips
7. **Technical SEO Checklist** — 19 items across 8 categories (On-Page, Technical, Core Web Vitals, Schema, E-E-A-T, Mobile, Image, GEO)
8. **SERP Preview** — Google desktop simulation with display URL, breadcrumb, rich results eligibility, estimated CTR
9. **Content Brief** — Recommended word count, H1, section-by-section outline (H2/H3), internal link suggestions, competitor topics
10. **E-E-A-T Signals** — Experience, Expertise, Authoritativeness, Trust with score out of 100

## AI Providers

| Provider | Model | Secret (Replit Secrets) | Env Var | Status |
|---|---|---|---|---|
| OpenAI | gpt-4o-mini | `OPENAI_API_KEY` | — | Optional |
| Gemini | gemini-2.0-flash | `GEMINI_API_KEY` | — | ✅ Configured |
| Qwen | qwen-max | `QWEN_API_KEY` | `QWEN_API_HOST` | ✅ Configured |
| Zhipu | glm-4-flash | `ZHIPU_API_KEY` | — | ✅ Configured |

### Qwen MaaS Setup
- **QWEN_API_HOST** (env var, non-secret): `ws-ug1fsmrwphwa3o5p.ap-southeast-1.maas.aliyuncs.com`
- **QWEN_API_KEY** (Replit Secret): stored encrypted, never in code
- Base URL auto-detected: MaaS hosts → `/v1`, Dashscope → `/compatible-mode/v1`

### Zhipu GLM Setup
- **ZHIPU_API_KEY** (Replit Secret): stored encrypted
- Base URL: `https://open.bigmodel.cn/api/paas/v4/`
- Model: `glm-4-flash`

### Gemini Setup
- **GEMINI_API_KEY** (Replit Secret): stored encrypted
- Base URL: `https://generativelanguage.googleapis.com/v1beta/openai/`
- Model: `gemini-2.0-flash`

### Security Notes
- All API keys are stored as **Replit Secrets** (AES-256 encrypted at rest)
- Keys are injected as environment variables at runtime — never written to files
- Never commit `.env` files or hardcode key values in source code
- To rotate a key: go to Replit Secrets panel → update the value → restart the API Server workflow

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod validators (do not edit)
- `artifacts/api-server/src/routes/seo.ts` — AI prompt + route handler
- `artifacts/seo-generator/src/pages/home.tsx` — full UI (sidebar + tabbed results)
- `artifacts/seo-generator/src/lib/i18n.ts` — Arabic/English translations

## Architecture decisions

- OpenAPI-first: all types flow from `openapi.yaml` → codegen → frontend + backend. Never edit generated files.
- Multi-provider via single OpenAI-compatible SDK — switch base URL + model per provider.
- Qwen base URL is Dashscope: `https://dashscope.aliyuncs.com/compatible-mode/v1` (not Alibaba Cloud MaaS which requires tenant URL).
- JSON-LD schema stored as stringified JSON in API response — frontend parses + pretty-prints.
- Tab-based results UI (Core SEO / Schema / GEO / Content Brief / E-E-A-T / Technical) to prevent overwhelming the user.

## User preferences

- Language: Arabic UI default, Arabic/English content toggle
- Platform: Revolutionary, Google 2026 compliant
- Design: Dark sidebar + clean results pane with animated card reveal

## Gotchas

- After any OpenAPI spec change, ALWAYS run `pnpm --filter @workspace/api-spec run codegen` before touching frontend or backend.
- Do NOT edit files in `lib/api-client-react/src/generated/` or `lib/api-zod/src/generated/` — they are overwritten by codegen.
- API server must be restarted after `seo.ts` changes (it builds to `dist/` via esbuild).
- Zhipu GLM-4 does not support `response_format: { type: "json_object" }` — use `extractJson()` fallback.
- Qwen uses Dashscope endpoint, not the old MaaS URL.
