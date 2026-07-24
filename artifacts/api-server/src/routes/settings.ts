import { Router, type IRouter } from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import {
  IMPORTED_QWEN_DEFAULT_MODEL,
  loadImportedProviderConfig,
} from "../lib/imported-provider-config.js";

const router: IRouter = Router();

/* ─── Config file location ─── */
const DATA_DIR  = join(process.cwd(), "data");
const CFG_FILE  = join(DATA_DIR, "settings.json");

interface StoredConfig {
  defaultProvider?: string;
  openai?: { key?: string; model?: string };
  gemini?: { key?: string; model?: string };
  qwen?:   { key?: string; model?: string; host?: string };
  zhipu?:  { key?: string; model?: string };
}

function loadConfig(): StoredConfig {
  const imported = loadImportedProviderConfig();

  try {
    const stored = existsSync(CFG_FILE)
      ? (JSON.parse(readFileSync(CFG_FILE, "utf-8")) as StoredConfig)
      : {};

    return {
      ...stored,
      defaultProvider:
        imported.qwenKey ? "qwen" : stored.defaultProvider,
      qwen: {
        ...stored.qwen,
        key: stored.qwen?.key || imported.qwenKey,
        host: stored.qwen?.host || imported.qwenHost,
        model: imported.qwenKey
          ? IMPORTED_QWEN_DEFAULT_MODEL
          : stored.qwen?.model,
      },
    };
  } catch {
    return {
      defaultProvider: imported.qwenKey ? "qwen" : undefined,
      qwen: {
        key: imported.qwenKey,
        host: imported.qwenHost,
      },
    };
  }
}

function saveConfig(cfg: StoredConfig): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(CFG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
}

function maskKey(key: string | undefined): string {
  if (!key || key.length < 8) return "";
  return key.slice(0, 6) + "..." + key.slice(-4);
}

function resolveKey(stored: string | undefined, envVar: string): string | undefined {
  return stored || process.env[envVar] || undefined;
}

/* ─── GET /api/settings ─── */
router.get("/settings", (_req, res) => {
  const cfg = loadConfig();

  const openaiKey = resolveKey(cfg.openai?.key, "OPENAI_API_KEY");
  const geminiKey = resolveKey(cfg.gemini?.key, "GEMINI_API_KEY");
  const qwenKey   = resolveKey(cfg.qwen?.key,   "QWEN_API_KEY");
  const zhipuKey  = resolveKey(cfg.zhipu?.key,  "ZHIPU_API_KEY");
  const qwenHost  = cfg.qwen?.host || process.env.QWEN_API_HOST || "";

  res.json({
    defaultProvider: cfg.defaultProvider || "gemini",
    providers: {
      openai: {
        name: "OpenAI",
        model: cfg.openai?.model || "gpt-4o-mini",
        keySet: !!openaiKey,
        keyMasked: maskKey(openaiKey),
      },
      gemini: {
        name: "Google Gemini",
        model: cfg.gemini?.model || "gemini-2.5-flash",
        keySet: !!geminiKey,
        keyMasked: maskKey(geminiKey),
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
      },
      qwen: {
        name: "Alibaba Qwen",
        model: cfg.qwen?.model || IMPORTED_QWEN_DEFAULT_MODEL,
        keySet: !!qwenKey,
        keyMasked: maskKey(qwenKey),
        baseUrl: qwenHost ? `https://${qwenHost}/compatible-mode/v1` : "",
      },
      zhipu: {
        name: "Zhipu GLM",
        model: cfg.zhipu?.model || "glm-4-flash",
        keySet: !!zhipuKey,
        keyMasked: maskKey(zhipuKey),
        baseUrl: "https://open.bigmodel.cn/api/paas/v4/",
      },
    },
  });
});

/* ─── PUT /api/settings ─── */
router.put("/settings", (req, res) => {
  const body = req.body as {
    defaultProvider?: string;
    openaiKey?: string; openaiModel?: string;
    geminiKey?: string; geminiModel?: string;
    qwenKey?: string;   qwenModel?: string; qwenHost?: string;
    zhipuKey?: string;  zhipuModel?: string;
  };

  const existing = loadConfig();

  const updated: StoredConfig = {
    defaultProvider: body.defaultProvider || existing.defaultProvider || "qwen",
    openai: {
      key:   body.openaiKey  !== undefined ? (body.openaiKey  || existing.openai?.key)  : existing.openai?.key,
      model: body.openaiModel || existing.openai?.model || "gpt-4o-mini",
    },
    gemini: {
      key:   body.geminiKey  !== undefined ? (body.geminiKey  || existing.gemini?.key)  : existing.gemini?.key,
      model: body.geminiModel || existing.gemini?.model || "gemini-2.5-flash",
    },
    qwen: {
      key:   body.qwenKey   !== undefined ? (body.qwenKey   || existing.qwen?.key)   : existing.qwen?.key,
      model: body.qwenModel  || existing.qwen?.model  || IMPORTED_QWEN_DEFAULT_MODEL,
      host:  body.qwenHost   || existing.qwen?.host   || process.env.QWEN_API_HOST || "",
    },
    zhipu: {
      key:   body.zhipuKey  !== undefined ? (body.zhipuKey  || existing.zhipu?.key)  : existing.zhipu?.key,
      model: body.zhipuModel || existing.zhipu?.model || "glm-4-flash",
    },
  };

  try {
    saveConfig(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to save settings");
    res.status(500).json({ error: "Failed to save settings" });
    return;
  }

  // Return same shape as GET
  const openaiKey = resolveKey(updated.openai?.key, "OPENAI_API_KEY");
  const geminiKey = resolveKey(updated.gemini?.key, "GEMINI_API_KEY");
  const qwenKey   = resolveKey(updated.qwen?.key,   "QWEN_API_KEY");
  const zhipuKey  = resolveKey(updated.zhipu?.key,  "ZHIPU_API_KEY");
  const qwenHost  = updated.qwen?.host || process.env.QWEN_API_HOST || "";

  res.json({
    defaultProvider: updated.defaultProvider,
    providers: {
      openai: { name: "OpenAI",        model: updated.openai?.model || "gpt-4o-mini",     keySet: !!openaiKey, keyMasked: maskKey(openaiKey) },
      gemini: { name: "Google Gemini", model: updated.gemini?.model || "gemini-2.5-flash", keySet: !!geminiKey, keyMasked: maskKey(geminiKey), baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/" },
      qwen:   { name: "Alibaba Qwen",  model: updated.qwen?.model   || IMPORTED_QWEN_DEFAULT_MODEL, keySet: !!qwenKey, keyMasked: maskKey(qwenKey), baseUrl: qwenHost ? `https://${qwenHost}/compatible-mode/v1` : "" },
      zhipu:  { name: "Zhipu GLM",     model: updated.zhipu?.model  || "glm-4-flash",      keySet: !!zhipuKey,  keyMasked: maskKey(zhipuKey),  baseUrl: "https://open.bigmodel.cn/api/paas/v4/" },
    },
  });
});

export { loadConfig, resolveKey };
export default router;
