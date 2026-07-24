import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, type Variants } from "framer-motion";
import { Link } from "wouter";
import {
  Save, Eye, EyeOff, CheckCircle2, XCircle, ArrowRight,
  Settings as SettingsIcon, Zap, Globe, Brain, Key, RefreshCw,
  AlertTriangle, Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGetSettings, useSaveSettings } from "@workspace/api-client-react";
import type { ProviderSettings } from "@workspace/api-client-react";
import { useLocalTheme } from "@/hooks/use-theme";
import { Sun, Moon, Languages } from "lucide-react";
import { translations, type Translations, type UiLang } from "@/lib/i18n";

/* ─── Model options per provider ─── */
const GEMINI_MODELS = [
  { value: "gemini-2.5-flash",      label: "Gemini 2.5 Flash ⭐ (الأفضل مجاناً)" },
  { value: "gemini-2.0-flash",      label: "Gemini 2.0 Flash" },
  { value: "gemini-2.5-pro",        label: "Gemini 2.5 Pro (مدفوع)" },
];

const QWEN_MODELS = [
  { value: "qwen3.7-flash",         label: "Qwen3.7 Flash ⭐ (متاح)" },
  { value: "qwen3.7-plus",          label: "Qwen3.7 Plus" },
  { value: "qwen3.7-max",           label: "Qwen3.7 Max" },
  { value: "qwen3-235b-a22b",       label: "Qwen3 235B (أقوى)" },
  { value: "qwen3.5-plus",          label: "Qwen3.5 Plus" },
  { value: "qwen-plus-latest",      label: "Qwen Plus Latest" },
  { value: "qwen3.5-flash",         label: "Qwen3.5 Flash (سريع)" },
];

const ZHIPU_MODELS = [
  { value: "glm-4-flash",           label: "GLM-4 Flash (مجاني)" },
  { value: "glm-5.1",               label: "GLM-5.1 ⭐ (الأفضل)" },
];

const OPENAI_MODELS = [
  { value: "gpt-4o-mini",           label: "GPT-4o Mini (اقتصادي)" },
  { value: "gpt-4o",                label: "GPT-4o (أفضل)" },
];

const DEFAULT_PROVIDERS = ["gemini", "qwen", "zhipu", "openai"] as const;

interface FormValues {
  defaultProvider: string;
  geminiKey: string; geminiModel: string;
  qwenKey: string;   qwenModel: string; qwenHost: string;
  zhipuKey: string;  zhipuModel: string;
  openaiKey: string; openaiModel: string;
}

const cardIn: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.07, ease: "easeOut" } }),
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useLocalTheme();
  const [uiLang, setUiLang] = useState<UiLang>(() => {
    try { return (localStorage.getItem("ui-lang") as UiLang) || "ar"; } catch { return "ar"; }
  });
  const t: Translations = translations[uiLang];
  const isRtl = uiLang === "ar";

  const { data: settings, isLoading, refetch } = useGetSettings();
  const saveSettings = useSaveSettings();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const form = useForm<FormValues>({
    defaultValues: {
      defaultProvider: "qwen",
      geminiKey: "", geminiModel: "gemini-2.5-flash",
      qwenKey:   "", qwenModel:   "qwen3.7-flash",
      qwenHost:  "ws-twcxat39x22mi7rg.ap-southeast-1.maas.aliyuncs.com",
      zhipuKey:  "", zhipuModel:  "glm-4-flash",
      openaiKey: "", openaiModel: "gpt-4o-mini",
    },
  });

  // Populate form when settings load
  useEffect(() => {
    if (!settings) return;
    form.reset({
      defaultProvider: settings.defaultProvider ?? "qwen",
      geminiKey: "", geminiModel: settings.providers?.gemini?.model ?? "gemini-2.5-flash",
      qwenKey:   "", qwenModel:   settings.providers?.qwen?.model   ?? "qwen3.7-flash",
      qwenHost:  (settings.providers?.qwen?.baseUrl ?? "").replace("https://","").replace("/compatible-mode/v1","") ||
                 "ws-twcxat39x22mi7rg.ap-southeast-1.maas.aliyuncs.com",
      zhipuKey:  "", zhipuModel:  settings.providers?.zhipu?.model  ?? "glm-4-flash",
      openaiKey: "", openaiModel: settings.providers?.openai?.model ?? "gpt-4o-mini",
    });
  }, [settings, form]);

  const toggleShow = (key: string) =>
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));

  function onSubmit(values: FormValues) {
    saveSettings.mutate(
      {
        data: {
          defaultProvider: values.defaultProvider,
          geminiKey:  values.geminiKey  || undefined,
          geminiModel: values.geminiModel,
          qwenKey:    values.qwenKey    || undefined,
          qwenModel:  values.qwenModel,
          qwenHost:   values.qwenHost   || undefined,
          zhipuKey:   values.zhipuKey   || undefined,
          zhipuModel: values.zhipuModel,
          openaiKey:  values.openaiKey  || undefined,
          openaiModel: values.openaiModel,
        },
      },
      {
        onSuccess: () => {
          toast({ title: isRtl ? "✅ تم الحفظ" : "✅ Saved", description: isRtl ? "تم حفظ الإعدادات بنجاح." : "Settings saved successfully." });
          // Clear key inputs, refetch status
          form.setValue("geminiKey", "");
          form.setValue("qwenKey", "");
          form.setValue("zhipuKey", "");
          form.setValue("openaiKey", "");
          refetch();
        },
        onError: () => {
          toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "فشل الحفظ." : "Failed to save.", variant: "destructive" });
        },
      }
    );
  }

  const providers: {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    keyField: keyof FormValues;
    modelField: keyof FormValues;
    hostField?: keyof FormValues;
    models: { value: string; label: string }[];
    docsUrl: string;
    badge?: string;
  }[] = [
    {
      id: "gemini",
      name: "Google Gemini",
      icon: <span className="text-lg">🔷</span>,
      color: "border-blue-500/30 bg-blue-500/5",
      keyField: "geminiKey",
      modelField: "geminiModel",
      models: GEMINI_MODELS,
      docsUrl: "https://aistudio.google.com/apikey",
      badge: "الأفضل مجاناً ⭐",
    },
    {
      id: "qwen",
      name: "Alibaba Qwen",
      icon: <span className="text-lg">🌐</span>,
      color: "border-orange-500/30 bg-orange-500/5",
      keyField: "qwenKey",
      modelField: "qwenModel",
      hostField: "qwenHost",
      models: QWEN_MODELS,
      docsUrl: "https://bailian.console.aliyun.com/",
      badge: "1M token مجاناً",
    },
    {
      id: "zhipu",
      name: "Zhipu GLM",
      icon: <span className="text-lg">🤖</span>,
      color: "border-violet-500/30 bg-violet-500/5",
      keyField: "zhipuKey",
      modelField: "zhipuModel",
      models: ZHIPU_MODELS,
      docsUrl: "https://open.bigmodel.cn/",
    },
    {
      id: "openai",
      name: "OpenAI",
      icon: <span className="text-lg">⚡</span>,
      color: "border-emerald-500/30 bg-emerald-500/5",
      keyField: "openaiKey",
      modelField: "openaiModel",
      models: OPENAI_MODELS,
      docsUrl: "https://platform.openai.com/api-keys",
    },
  ];

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background text-foreground">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1.5 text-xs">
                <ArrowRight className={`h-3.5 w-3.5 ${isRtl ? "" : "rotate-180"}`} />
                {isRtl ? "العودة للرئيسية" : "Back to Generator"}
              </Button>
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{isRtl ? "إعدادات المزودين" : "Provider Settings"}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground"
              onClick={() => { setUiLang(l => l === "ar" ? "en" : "ar"); localStorage.setItem("ui-lang", uiLang === "ar" ? "en" : "ar"); }}>
              <Languages className="h-3.5 w-3.5 me-1" />{t.uiLangToggle}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            {isRtl ? "⚙️ إعدادات مفاتيح API" : "⚙️ API Key Settings"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRtl
              ? "أضف مفاتيح مزودي الذكاء الاصطناعي واختر النماذج. المفاتيح تُحفظ على الخادم فقط، لا تظهر في المتصفح بعد الحفظ."
              : "Add AI provider keys and select models. Keys are stored server-side only and masked after saving."}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin me-2" />
            {isRtl ? "جارٍ التحميل..." : "Loading..."}
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Default provider */}
            <motion.div custom={0} variants={cardIn} initial="hidden" animate="visible">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {isRtl ? "المزود الافتراضي" : "Default Provider"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isRtl ? "يُستخدم عند فتح التطبيق" : "Used when the app opens"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={form.watch("defaultProvider")}
                    onValueChange={v => form.setValue("defaultProvider", v)}
                  >
                    <SelectTrigger className="h-10 bg-background border-border/50 max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_PROVIDERS.map(p => (
                        <SelectItem key={p} value={p}>
                          {providers.find(pr => pr.id === p)?.name ?? p}
                          {p === "gemini" ? " ⭐" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </motion.div>

            {/* Provider cards */}
            {providers.map((prov, idx) => {
              const status = settings?.providers?.[prov.id as keyof ProviderSettings["providers"]];
              const keySet  = status?.keySet ?? false;
              const masked  = status?.keyMasked ?? "";
              const isShown = showKeys[prov.id] ?? false;

              return (
                <motion.div key={prov.id} custom={idx + 1} variants={cardIn} initial="hidden" animate="visible">
                  <Card className={`border ${prov.color} transition-shadow hover:shadow-md`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {prov.icon}
                          <div>
                            <CardTitle className="text-sm font-semibold">{prov.name}</CardTitle>
                            {prov.badge && (
                              <Badge variant="outline" className="text-[10px] font-mono mt-0.5 border-primary/30 bg-primary/5 text-primary">
                                {prov.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {keySet ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="font-mono">{masked}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <XCircle className="h-3.5 w-3.5" />
                              <span>{isRtl ? "غير مضبوط" : "Not set"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* API Key input */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Key className="h-3 w-3" />
                          {isRtl ? "مفتاح API" : "API Key"}
                          {keySet && (
                            <span className="text-[10px] text-emerald-500">
                              ({isRtl ? "محفوظ — أدخل قيمة جديدة للتحديث" : "saved — enter new value to update"})
                            </span>
                          )}
                        </Label>
                        <div className="relative">
                          <Input
                            {...form.register(prov.keyField)}
                            type={isShown ? "text" : "password"}
                            placeholder={keySet
                              ? (isRtl ? "اتركه فارغاً للإبقاء على المفتاح الحالي" : "Leave empty to keep current key")
                              : (isRtl ? "أدخل مفتاح API..." : "Enter API key...")}
                            dir="ltr"
                            className="pe-10 bg-background border-border/50 font-mono text-sm h-10"
                          />
                          <Button type="button" variant="ghost" size="icon"
                            className="absolute end-1 top-1 h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => toggleShow(prov.id)}>
                            {isShown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>

                      {/* Qwen host */}
                      {prov.hostField && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Server className="h-3 w-3" />
                            {isRtl ? "API Host (MaaS endpoint)" : "API Host (MaaS endpoint)"}
                          </Label>
                          <Input
                            {...form.register(prov.hostField)}
                            dir="ltr"
                            placeholder="ws-xxxx.ap-southeast-1.maas.aliyuncs.com"
                            className="bg-background border-border/50 font-mono text-sm h-10"
                          />
                        </div>
                      )}

                      {/* Model selector */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Brain className="h-3 w-3" />
                          {isRtl ? "النموذج" : "Model"}
                        </Label>
                        <Select
                          value={form.watch(prov.modelField)}
                          onValueChange={v => form.setValue(prov.modelField, v)}
                        >
                          <SelectTrigger className="h-10 bg-background border-border/50 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {prov.models.map(m => (
                              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Docs link */}
                      <a href={prov.docsUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <Globe className="h-3 w-3" />
                        {isRtl ? "احصل على مفتاحك من هنا ↗" : "Get your key here ↗"}
                      </a>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {/* Security note */}
            <motion.div custom={5} variants={cardIn} initial="hidden" animate="visible">
              <div className="flex items-start gap-2.5 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  {isRtl
                    ? "المفاتيح تُحفظ في ملف data/settings.json على الخادم فقط ولا تُنقل إلى المتصفح. للحماية القصوى استخدم Replit Secrets."
                    : "Keys are stored in data/settings.json on the server only and never sent to the browser. For maximum security use Replit Secrets."}
                </p>
              </div>
            </motion.div>

            {/* Save button */}
            <motion.div custom={6} variants={cardIn} initial="hidden" animate="visible">
              <Button
                type="submit"
                disabled={saveSettings.isPending}
                className="w-full h-12 text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] gap-2"
              >
                {saveSettings.isPending
                  ? <><RefreshCw className="h-4 w-4 animate-spin" />{isRtl ? "جارٍ الحفظ..." : "Saving..."}</>
                  : <><Save className="h-4 w-4" />{isRtl ? "حفظ الإعدادات" : "Save Settings"}</>}
              </Button>
            </motion.div>
          </form>
        )}
      </div>
    </div>
  );
}
