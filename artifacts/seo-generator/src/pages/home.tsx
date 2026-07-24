import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Terminal, Loader2, Check, Sun, Moon, Languages,
  TrendingUp, Hash, HelpCircle, FileText, Zap, Globe, Search,
  Shield, BookOpen, Link2, Target, Mic, AlertTriangle,
  CheckCircle2, XCircle, ChevronDown, ChevronRight, Eye, Star,
  MapPin, Users, Layers, Brain, Award, Network,
} from "lucide-react";
import { useLocalTheme } from "@/hooks/use-theme";
import { useGenerateSeo } from "@workspace/api-client-react";
import type { SeoResult, SchemaMarkup, ChecklistItem, SemanticKeyword } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { translations, type UiLang } from "@/lib/i18n";

/* ─── Schema ─── */
const formSchema = z.object({
  serviceName:    z.string().min(2).max(200),
  language:       z.enum(["ar", "en"]),
  tone:           z.enum(["professional", "friendly", "persuasive"]),
  provider:       z.enum(["openai", "gemini", "qwen", "zhipu"]),
  businessType:   z.string().default("local"),
  location:       z.string().optional(),
  targetAudience: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

/* ─── Animation helpers ─── */
const cardIn = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
};

/* ─── SEO score calculator ─── */
function calcSeoScore(r: SeoResult) {
  const titleOk   = r.title.length >= 50 && r.title.length <= 60;
  const metaOk    = r.metaDescription.length >= 150 && r.metaDescription.length <= 160;
  const kwOk      = r.keywords.length >= 8;
  const faqOk     = r.faqItems.length >= 4;
  const schemaOk  = r.schemaMarkups.length >= 3;
  const semanticOk = r.semanticKeywords.length >= 5;

  const scores = {
    title:    titleOk ? 20 : r.title.length > 30 ? 12 : 5,
    meta:     metaOk  ? 20 : r.metaDescription.length > 80 ? 12 : 5,
    keywords: kwOk    ? 15 : Math.min(r.keywords.length * 2, 12),
    faq:      faqOk   ? 15 : Math.min(r.faqItems.length * 4, 12),
    schema:   schemaOk ? 15 : Math.min(r.schemaMarkups.length * 4, 12),
    semantic: semanticOk ? 15 : Math.min(r.semanticKeywords.length * 3, 12),
  };
  return {
    score: Object.values(scores).reduce((a, b) => a + b, 0),
    titleOk, metaOk, kwOk, faqOk, schemaOk, semanticOk,
    totalWords: [r.title, r.metaDescription, r.slogan, r.ogDescription]
      .join(" ").split(/\s+/).filter(Boolean).length,
    totalChars: r.title.length + r.metaDescription.length + r.slogan.length,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Home — root component
═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const { toast }              = useToast();
  const { theme, toggleTheme } = useLocalTheme();
  const generateSeo            = useGenerateSeo();
  const [result, setResult]    = useState<SeoResult | null>(null);
  const [uiLang, setUiLang]    = useState<UiLang>(() => {
    try { return (localStorage.getItem("ui-lang") as UiLang) || "ar"; } catch { return "ar"; }
  });

  const t       = translations[uiLang];
  const isUiRtl = uiLang === "ar";

  useEffect(() => {
    try { localStorage.setItem("ui-lang", uiLang); } catch { /**/ }
  }, [uiLang]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceName: "", language: "ar", tone: "professional",
      provider: "openai", businessType: "local", location: "", targetAudience: "",
    },
  });

  const outputLanguage = form.watch("language");
  const isOutputRtl    = outputLanguage === "ar";

  function onSubmit(values: FormValues) {
    generateSeo.mutate({ data: values }, {
      onSuccess: (data) => {
        setResult(data);
        toast({ title: t.generationComplete, description: t.generationSuccess });
      },
      onError: (err: unknown) => {
        const raw = err as { data?: { error?: string } };
        const msg = raw?.data?.error ?? t.errorDesc;
        toast({ title: t.errorTitle, description: msg, variant: "destructive" });
      },
    });
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t.copied, description: `${field} ${t.copiedDesc}` });
  };

  return (
    <div
      dir={isUiRtl ? "rtl" : "ltr"}
      className="flex h-screen w-full flex-col md:flex-row bg-background text-foreground overflow-hidden"
    >
      {/* ── Sidebar ── */}
      <aside className="w-full md:w-[380px] lg:w-[430px] flex-shrink-0 border-e border-border bg-sidebar flex flex-col h-full z-10 shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 text-primary">
              <div className="p-2 bg-primary/10 rounded-lg ring-1 ring-primary/20">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-sidebar-foreground">{t.appName}</h1>
                <p className="text-[10px] text-primary/70 font-mono">Google 2026 Standards</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-mono text-muted-foreground hover:text-primary"
                onClick={() => setUiLang(l => l === "ar" ? "en" : "ar")}>
                <Languages className="h-3.5 w-3.5 me-1" />
                {t.uiLangToggle}
              </Button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Service Name */}
              <FormField control={form.control} name="serviceName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                    {t.targetLabel}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t.targetPlaceholder} dir={isUiRtl ? "rtl" : "ltr"} {...field}
                      className="font-medium bg-background border-border/50 focus-visible:ring-primary h-11" />
                  </FormControl>
                  <FormDescription className="text-xs">{t.targetDescription}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Business Type */}
              <FormField control={form.control} name="businessType" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                    {t.businessTypeLabel}
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 bg-background border-border/50 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(t.businessTypes).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              {/* Language + Tone */}
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="language" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.outputLangLabel}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-background border-border/50 text-sm"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ar">{t.langOptions.ar}</SelectItem>
                        <SelectItem value="en">{t.langOptions.en}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="tone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.voiceToneLabel}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-background border-border/50 text-sm"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="professional">{t.toneOptions.professional}</SelectItem>
                        <SelectItem value="persuasive">{t.toneOptions.persuasive}</SelectItem>
                        <SelectItem value="friendly">{t.toneOptions.friendly}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              {/* Location + Audience */}
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{t.locationLabel}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t.locationPlaceholder} dir={isUiRtl ? "rtl" : "ltr"} {...field}
                      className="h-9 bg-background border-border/50 text-sm" />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="targetAudience" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1">
                    <Users className="h-3 w-3" />{t.audienceLabel}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t.audiencePlaceholder} dir={isUiRtl ? "rtl" : "ltr"} {...field}
                      className="h-9 bg-background border-border/50 text-sm" />
                  </FormControl>
                </FormItem>
              )} />

              {/* Provider */}
              <FormField control={form.control} name="provider" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.providerLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 bg-background border-border/50 text-sm"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(t.providers).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              {/* Submit */}
              <div className="pt-3 border-t border-border/50">
                <Button type="submit" disabled={generateSeo.isPending}
                  className="w-full h-12 text-sm font-bold tracking-wide shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] group relative overflow-hidden transition-all">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  <span className="relative flex items-center gap-2">
                    {generateSeo.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin" />{t.processing}</>
                      : <><Zap className="h-4 w-4" />{t.executeBtn}</>}
                  </span>
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Bottom badge */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex flex-wrap gap-1.5">
            {["Schema Markup","GEO/AI","E-E-A-T","Core Web Vitals","SERP Preview"].map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/70 font-mono border border-primary/20">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Results pane ── */}
      <main className="flex-1 bg-background overflow-y-auto">
        <div className="min-h-full p-4 md:p-6 lg:p-8">
          {generateSeo.isPending ? (
            <LoadingSkeleton />
          ) : !result ? (
            <EmptyState t={t} />
          ) : (
            <ResultsView
              result={result}
              isOutputRtl={isOutputRtl}
              t={t}
              handleCopy={handleCopy}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── Loading skeleton ─── */
function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <Skeleton className="h-28 rounded-2xl" />
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-10 gap-5">
        <Skeleton className="md:col-span-7 h-64 rounded-2xl" />
        <Skeleton className="md:col-span-3 h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyState({ t }: { t: typeof translations["en"] }) {
  const features = [
    { icon: <Layers className="w-4 h-4" />, label: "Schema Markup" },
    { icon: <Brain className="w-4 h-4" />, label: "GEO / AI Overviews" },
    { icon: <Award className="w-4 h-4" />, label: "E-E-A-T Signals" },
    { icon: <Eye className="w-4 h-4" />, label: "SERP Preview" },
    { icon: <BookOpen className="w-4 h-4" />, label: "Content Brief" },
    { icon: <Network className="w-4 h-4" />, label: "Semantic Keywords" },
  ];
  return (
    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-20">
      <div className="w-16 h-16 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-center mb-6">
        <Zap className="w-7 h-7 text-primary/50" />
      </div>
      <h2 className="text-xl font-bold tracking-tight mb-2">{t.standbyTitle}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">{t.standbyDesc}</p>
      <div className="grid grid-cols-3 gap-2 w-full">
        {features.map(f => (
          <div key={f.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 bg-muted/30 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
            {f.icon}
            <span className="text-[10px] font-mono">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Results View — Tabbed Architecture
═══════════════════════════════════════════════════════════════ */
function ResultsView({
  result, isOutputRtl, t, handleCopy,
}: {
  result: SeoResult;
  isOutputRtl: boolean;
  t: typeof translations["en"];
  handleCopy: (text: string, field: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    let n = 0;
    const id = setInterval(() => {
      n++;
      setVisibleCount(n);
      if (n >= 20) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, [result]);

  const stats = calcSeoScore(result);
  const show  = (i: number) => i < visibleCount;

  const scoreColor = stats.score >= 80 ? "text-emerald-500" : stats.score >= 55 ? "text-amber-500" : "text-red-500";
  const scoreBg    = stats.score >= 80 ? "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20"
    : stats.score >= 55 ? "from-amber-500/10 to-amber-500/5 border-amber-500/20"
    : "from-red-500/10 to-red-500/5 border-red-500/20";

  return (
    <div dir={isOutputRtl ? "rtl" : "ltr"} className="max-w-5xl mx-auto space-y-5 pb-24">

      {/* ── Header + Score ── */}
      <AC show={show(0)}>
        <div className={`rounded-2xl border bg-gradient-to-br ${scoreBg} p-5`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-mono text-primary border-primary/40 bg-primary/10 text-xs">
                  {t.statusSuccess}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs border-border/50">2026</Badge>
              </div>
              <h2 className="text-xl font-bold tracking-tight">{t.generatedTitle}</h2>
            </div>
            {/* Score */}
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p className={`text-5xl font-black tabular-nums leading-none ${scoreColor}`}>{stats.score}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">/ 100 {t.seoScore}</p>
              </div>
            </div>
          </div>
          {/* Stat pills */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
            <SP icon={<FileText className="h-3.5 w-3.5" />} label={t.titleStat} value={`${result.title.length}c`} ok={stats.titleOk} />
            <SP icon={<FileText className="h-3.5 w-3.5" />} label={t.metaStat}  value={`${result.metaDescription.length}c`} ok={stats.metaOk} />
            <SP icon={<Hash className="h-3.5 w-3.5" />}     label={t.keywordsStat} value={`${result.keywords.length}`} ok={stats.kwOk} />
            <SP icon={<HelpCircle className="h-3.5 w-3.5" />} label={t.faqStat}  value={`${result.faqItems.length}`} ok={stats.faqOk} />
            <SP icon={<Layers className="h-3.5 w-3.5" />}   label={t.schemaStat} value={`${result.schemaMarkups.length}`} ok={stats.schemaOk} />
            <SP icon={<Network className="h-3.5 w-3.5" />}  label={t.semanticStat} value={`${result.semanticKeywords.length}`} ok={stats.semanticOk} />
          </div>
        </div>
      </AC>

      {/* ── SERP Preview ── */}
      <AC show={show(1)}>
        <SerpPreviewCard result={result} t={t} handleCopy={handleCopy} />
      </AC>

      {/* ── Tabs for the rest ── */}
      <AC show={show(2)}>
        <Tabs defaultValue="core" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl mb-5">
            {[
              { value: "core",    icon: <FileText className="h-3.5 w-3.5" />,  label: "Core SEO" },
              { value: "schema",  icon: <Layers className="h-3.5 w-3.5" />,    label: "Schema" },
              { value: "geo",     icon: <Brain className="h-3.5 w-3.5" />,     label: "GEO / AI" },
              { value: "content", icon: <BookOpen className="h-3.5 w-3.5" />,  label: t.contentBriefLabel },
              { value: "eeat",    icon: <Award className="h-3.5 w-3.5" />,     label: "E-E-A-T" },
              { value: "tech",    icon: <Shield className="h-3.5 w-3.5" />,    label: "Technical" },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                {tab.icon}{tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── CORE SEO ── */}
          <TabsContent value="core" className="space-y-4 mt-0">
            <AC show={show(3)}>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-transparent rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                <Card className="relative border-primary/20">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.sloganLabel}</CardTitle>
                    <CopyBtn onClick={() => handleCopy(result.slogan, t.sloganLabel)} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl md:text-3xl font-bold leading-tight">{result.slogan}</p>
                  </CardContent>
                </Card>
              </div>
            </AC>
            <AC show={show(4)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.pageTitleLabel}</CardTitle>
                    <CopyBtn onClick={() => handleCopy(result.title, t.pageTitleLabel)} />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-base font-medium leading-snug">{result.title}</p>
                    <CharBar value={result.title.length} min={50} max={60} label={t.lengthLabel} />
                  </CardContent>
                </Card>
                <Card className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.slugLabel}</CardTitle>
                    <CopyBtn onClick={() => handleCopy(result.canonicalSlug, t.slugLabel)} />
                  </CardHeader>
                  <CardContent className="flex items-center">
                    <div className="p-3 bg-secondary rounded-lg border border-border/50 overflow-x-auto w-full" dir="ltr">
                      <code className="text-sm font-mono text-primary/90 whitespace-nowrap">/{result.canonicalSlug}</code>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AC>
            <AC show={show(5)}>
              <Card className="border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.metaDescLabel}</CardTitle>
                  <CopyBtn onClick={() => handleCopy(result.metaDescription, t.metaDescLabel)} />
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">{result.metaDescription}</p>
                  <CharBar value={result.metaDescription.length} min={150} max={160} label={t.lengthLabel} />
                </CardContent>
              </Card>
            </AC>
            <AC show={show(6)}>
              <Card className="border-border/50">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.keywordsLabel}</CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-mono text-muted-foreground hover:text-primary"
                    onClick={() => { navigator.clipboard.writeText(result.keywords.join(", ")); }}>
                    <Copy className="h-3 w-3 me-1.5" />{t.copyAll}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" onClick={() => handleCopy(kw, kw)}
                        className="px-3 py-1 font-normal border border-border/50 cursor-pointer hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </AC>
            <AC show={show(7)}>
              <SemanticKeywordsCard result={result} t={t} handleCopy={handleCopy} />
            </AC>
            <AC show={show(8)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SocialCard title={t.ogLabel} color="bg-blue-500" fields={[
                  { label: "og:title", value: result.ogTitle, onCopy: () => handleCopy(result.ogTitle, "og:title") },
                  { label: "og:description", value: result.ogDescription, onCopy: () => handleCopy(result.ogDescription, "og:description"), muted: true },
                ]} />
                <SocialCard title={t.twitterLabel} color="bg-sky-400" fields={[
                  { label: "twitter:title", value: result.twitterTitle, onCopy: () => handleCopy(result.twitterTitle, "twitter:title") },
                  { label: "twitter:description", value: result.twitterDescription, onCopy: () => handleCopy(result.twitterDescription, "twitter:description"), muted: true },
                ]} />
              </div>
            </AC>
            <AC show={show(9)}>
              <FaqCard result={result} t={t} handleCopy={handleCopy} />
            </AC>
          </TabsContent>

          {/* ── SCHEMA ── */}
          <TabsContent value="schema" className="mt-0">
            <AC show={show(3)}>
              <SchemaMarkupPanel result={result} t={t} handleCopy={handleCopy} />
            </AC>
          </TabsContent>

          {/* ── GEO ── */}
          <TabsContent value="geo" className="mt-0">
            <AC show={show(3)}>
              <GeoPanel result={result} t={t} handleCopy={handleCopy} />
            </AC>
          </TabsContent>

          {/* ── CONTENT BRIEF ── */}
          <TabsContent value="content" className="mt-0">
            <AC show={show(3)}>
              <ContentBriefPanel result={result} t={t} handleCopy={handleCopy} />
            </AC>
          </TabsContent>

          {/* ── E-E-A-T ── */}
          <TabsContent value="eeat" className="mt-0">
            <AC show={show(3)}>
              <EeatPanel result={result} t={t} />
            </AC>
          </TabsContent>

          {/* ── TECHNICAL ── */}
          <TabsContent value="tech" className="mt-0">
            <AC show={show(3)}>
              <TechChecklistPanel result={result} t={t} />
            </AC>
          </TabsContent>
        </Tabs>
      </AC>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sub-panels
═══════════════════════════════════════════════════════════════ */

function SerpPreviewCard({ result, t, handleCopy }: {
  result: SeoResult; t: typeof translations["en"]; handleCopy: (text: string, field: string) => void;
}) {
  const s = result.serpPreview;
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
          <Eye className="h-3.5 w-3.5" />{t.serpLabel}
        </CardTitle>
        <div className="flex items-center gap-2">
          {s.estimatedCtr && (
            <Badge variant="outline" className="text-xs font-mono border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
              CTR: {s.estimatedCtr}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Desktop preview */}
        <div className="rounded-xl border border-border/50 bg-white dark:bg-zinc-950 p-5 shadow-sm font-sans" dir="ltr">
          <p className="text-xs text-green-700 dark:text-green-500 mb-0.5 font-mono">{s.displayUrl}</p>
          <p className="text-xs text-green-600 dark:text-green-600 mb-1">{s.breadcrumb}</p>
          <p className="text-[18px] text-blue-700 dark:text-blue-400 font-medium leading-snug mb-1 hover:underline cursor-pointer">
            {s.titlePreview || result.title}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
            {s.descriptionPreview || result.metaDescription}
          </p>
        </div>
        {/* Rich results */}
        {s.richResultEligible && s.richResultEligible.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-mono mb-2">{t.richResultsLabel}</p>
            <div className="flex flex-wrap gap-2">
              {s.richResultEligible.map((r, i) => (
                <Badge key={i} className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border font-mono text-xs">
                  <Star className="h-3 w-3 me-1" />{r}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-primary"
          onClick={() => handleCopy(`${s.titlePreview || result.title}\n${s.descriptionPreview || result.metaDescription}\n${s.displayUrl}`, t.serpLabel)}>
          <Copy className="h-3 w-3 me-1.5" />Copy preview text
        </Button>
      </CardContent>
    </Card>
  );
}

function SchemaMarkupPanel({ result, t, handleCopy }: {
  result: SeoResult; t: typeof translations["en"]; handleCopy: (text: string, field: string) => void;
}) {
  const priorityColor = (p: SchemaMarkup["priority"]) =>
    p === "high" ? "bg-red-500/10 text-red-600 border-red-500/20"
    : p === "medium" ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
    : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" />{t.schemaDesc}
        </p>
      </div>
      {result.schemaMarkups.map((schema, i) => (
        <Card key={i} className="border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">{schema.label}</CardTitle>
              {schema.priority && (
                <Badge variant="outline" className={`text-[10px] font-mono border ${priorityColor(schema.priority)}`}>
                  {schema.priority}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 bg-primary/5 text-primary">
                {schema.schemaType}
              </Badge>
            </div>
            <CopyBtn onClick={() => handleCopy(
              `<script type="application/ld+json">\n${schema.jsonLd}\n</script>`,
              schema.label
            )} label={t.copySchema} />
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-zinc-950 dark:bg-black border border-border/30 overflow-x-auto" dir="ltr">
              <pre className="text-[11px] font-mono text-zinc-300 p-4 whitespace-pre-wrap leading-relaxed">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(schema.jsonLd), null, 2);
                  } catch {
                    return schema.jsonLd;
                  }
                })()}
              </pre>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GeoPanel({ result, t, handleCopy }: {
  result: SeoResult; t: typeof translations["en"]; handleCopy: (text: string, field: string) => void;
}) {
  const geo = result.geoContent;
  if (!geo) return null;
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-violet-600 dark:text-violet-400">{t.geoLabel}</h3>
        </div>
        <p className="text-xs text-muted-foreground">Generative Engine Optimization — Google AI Overviews, Featured Snippets, PAA, Voice Search</p>
      </div>

      {/* Direct Answer */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
            <Brain className="h-3.5 w-3.5 text-violet-500" />{t.directAnswerLabel}
          </CardTitle>
          <CopyBtn onClick={() => handleCopy(geo.directAnswer, t.directAnswerLabel)} />
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-violet-500/5 border border-violet-500/20">
            <p className="text-sm leading-relaxed">{geo.directAnswer}</p>
          </div>
        </CardContent>
      </Card>

      {/* Featured Snippet */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-blue-500" />{t.featuredSnippetLabel}
          </CardTitle>
          <CopyBtn onClick={() => handleCopy(geo.featuredSnippet, t.featuredSnippetLabel)} />
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p className="text-sm leading-relaxed font-medium">{geo.featuredSnippet}</p>
          </div>
        </CardContent>
      </Card>

      {/* Voice Search */}
      {geo.voiceSearchQuery && (
        <Card className="border-border/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
              <Mic className="h-3.5 w-3.5 text-emerald-500" />{t.voiceSearchLabel}
            </CardTitle>
            <CopyBtn onClick={() => handleCopy(geo.voiceSearchQuery!, t.voiceSearchLabel)} />
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-base font-medium italic">{geo.voiceSearchQuery}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* People Also Ask */}
      {geo.peopleAlsoAsk && geo.peopleAlsoAsk.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-orange-500" />{t.paaLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {geo.peopleAlsoAsk.map((q, i) => (
                <AccordionItem key={i} value={`paa-${i}`} className="border-border/50">
                  <AccordionTrigger className="text-sm font-medium hover:text-primary text-start">
                    {q.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                    {q.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* AI Overview Tips */}
      {geo.aiOverviewTips && geo.aiOverviewTips.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-amber-500" />{t.aiOverviewTipsLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {geo.aiOverviewTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ContentBriefPanel({ result, t, handleCopy }: {
  result: SeoResult; t: typeof translations["en"]; handleCopy: (text: string, field: string) => void;
}) {
  const cb = result.contentBrief;
  if (!cb) return null;
  const headingColor = (level: string) =>
    level === "H2" ? "text-primary border-primary/30 bg-primary/5"
    : level === "H3" ? "text-violet-500 border-violet-500/30 bg-violet-500/5"
    : "text-orange-500 border-orange-500/30 bg-orange-500/5";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-border/50 text-center p-5">
          <p className="text-3xl font-black text-primary">{cb.recommendedWordCount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground font-mono mt-1">{t.wordCountLabel}</p>
        </Card>
        <Card className="md:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.suggestedH1Label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{cb.suggestedH1}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sections */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5" />{t.sectionsLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cb.sections.map((section, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                <Badge variant="outline" className={`text-[10px] font-mono border flex-shrink-0 ${headingColor(section.headingLevel)}`}>
                  {section.headingLevel}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold mb-0.5">{section.heading}</p>
                  <p className="text-xs text-muted-foreground">{section.purpose}</p>
                  {section.keywordsToInclude && section.keywordsToInclude.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {section.keywordsToInclude.map((kw, ki) => (
                        <span key={ki} className="text-[10px] px-1.5 py-0.5 bg-secondary rounded font-mono">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-mono flex-shrink-0">{section.wordCount}w</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Internal Links */}
        {cb.internalLinkSuggestions && cb.internalLinkSuggestions.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5" />{t.internalLinksLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {cb.internalLinkSuggestions.map((link, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-primary flex-shrink-0" />
                    <span>{link}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {/* Competitor Topics */}
        {cb.competitorTopics && cb.competitorTopics.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" />{t.competitorTopicsLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {cb.competitorTopics.map((topic, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function EeatPanel({ result, t }: { result: SeoResult; t: typeof translations["en"] }) {
  const eeat = result.eeatSignals;
  if (!eeat) return null;
  const scoreColor = (s: number) =>
    s >= 70 ? "text-emerald-500" : s >= 50 ? "text-amber-500" : "text-red-500";
  const scoreBg = (s: number) =>
    s >= 70 ? "bg-emerald-500" : s >= 50 ? "bg-amber-500" : "bg-red-500";

  const sections = [
    { label: t.experienceLabel, items: eeat.experienceSignals, color: "text-blue-500", icon: <Star className="h-4 w-4 text-blue-500" /> },
    { label: t.expertiseLabel, items: eeat.expertiseSignals, color: "text-violet-500", icon: <Brain className="h-4 w-4 text-violet-500" /> },
    { label: t.authorityLabel, items: eeat.authoritativenessSignals, color: "text-amber-500", icon: <Award className="h-4 w-4 text-amber-500" /> },
    { label: t.trustLabel, items: eeat.trustSignals, color: "text-emerald-500", icon: <Shield className="h-4 w-4 text-emerald-500" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Score */}
      <Card className="border-border/50">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-6">
            <div className="text-center flex-shrink-0">
              <p className={`text-6xl font-black ${scoreColor(eeat.overallScore ?? 50)}`}>{eeat.overallScore ?? 50}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">/ 100 {t.eeatScoreLabel}</p>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${scoreBg(eeat.overallScore ?? 50)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${eeat.overallScore ?? 50}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {(eeat.overallScore ?? 50) >= 70 ? "Strong E-E-A-T" : (eeat.overallScore ?? 50) >= 50 ? "Developing E-E-A-T" : "Needs E-E-A-T Work"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {s.icon}{s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(s.items || []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TechChecklistPanel({ result, t }: { result: SeoResult; t: typeof translations["en"] }) {
  const grouped = result.technicalChecklist.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const priorityStyle = (p: ChecklistItem["priority"]) =>
    p === "critical" ? "text-red-600 bg-red-500/10 border-red-500/20"
    : p === "high" ? "text-orange-600 bg-orange-500/10 border-orange-500/20"
    : p === "medium" ? "text-amber-600 bg-amber-500/10 border-amber-500/20"
    : "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";

  const categoryIcon: Record<string, React.ReactNode> = {
    "On-Page SEO":      <FileText className="h-3.5 w-3.5" />,
    "Technical SEO":    <Terminal className="h-3.5 w-3.5" />,
    "Core Web Vitals":  <Zap className="h-3.5 w-3.5" />,
    "Schema Markup":    <Layers className="h-3.5 w-3.5" />,
    "E-E-A-T":         <Award className="h-3.5 w-3.5" />,
    "Mobile SEO":       <Globe className="h-3.5 w-3.5" />,
    "Image SEO":        <Eye className="h-3.5 w-3.5" />,
    "GEO / AI Search":  <Brain className="h-3.5 w-3.5" />,
  };

  const totalCritical = result.technicalChecklist.filter(i => i.priority === "critical").length;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
        <p className="text-xs font-mono text-red-600 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          {totalCritical} critical items require immediate attention
        </p>
      </div>
      {Object.entries(grouped).map(([category, items]) => (
        <Card key={category} className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="text-primary">{categoryIcon[category] || <Shield className="h-3.5 w-3.5" />}</span>
              {category}
              <Badge variant="outline" className="text-[10px] font-mono ms-auto border-border/50">
                {items.length} items
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:border-border transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.item}</p>
                    {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-mono border flex-shrink-0 ${priorityStyle(item.priority)}`}>
                    {item.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SemanticKeywordsCard({ result, t, handleCopy }: {
  result: SeoResult; t: typeof translations["en"]; handleCopy: (text: string, field: string) => void;
}) {
  const intentColor = (intent: SemanticKeyword["intent"]) =>
    intent === "transactional" ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
    : intent === "commercial" ? "text-blue-600 bg-blue-500/10 border-blue-500/20"
    : intent === "navigational" ? "text-violet-600 bg-violet-500/10 border-violet-500/20"
    : "text-orange-600 bg-orange-500/10 border-orange-500/20";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
          <Network className="h-3.5 w-3.5" />{t.semanticLabel}
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-8 text-xs font-mono text-muted-foreground hover:text-primary"
          onClick={() => handleCopy(result.semanticKeywords.map(k => k.keyword).join(", "), t.semanticLabel)}>
          <Copy className="h-3 w-3 me-1.5" />{t.copyAll}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {result.semanticKeywords.map((kw, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/30 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => handleCopy(kw.keyword, kw.keyword)}>
              <span className="text-sm">{kw.keyword}</span>
              <Badge variant="outline" className={`text-[9px] font-mono border ${intentColor(kw.intent)}`}>
                {t.intentLabels[kw.intent]}
              </Badge>
              {kw.isLsi && <span className="text-[9px] text-muted-foreground font-mono">LSI</span>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FaqCard({ result, t, handleCopy }: {
  result: SeoResult; t: typeof translations["en"]; handleCopy: (text: string, field: string) => void;
}) {
  const faqJsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: result.faqItems.map(f => ({
      "@type": "Question", name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.faqLabel}</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 text-xs font-mono text-muted-foreground hover:text-primary"
          onClick={() => handleCopy(JSON.stringify(faqJsonLd, null, 2), "FAQ JSON-LD")}>
          <Copy className="h-3 w-3 me-1.5" />{t.copyJsonLd}
        </Button>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {result.faqItems.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-border/50">
              <AccordionTrigger className="text-sm font-medium hover:text-primary text-start">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-1">
                <div className="flex flex-col gap-3">
                  <p>{faq.answer}</p>
                  <Button variant="outline" size="sm" className="self-start text-xs h-7 bg-transparent border-border/50"
                    onClick={() => handleCopy(`Q: ${faq.question}\nA: ${faq.answer}`, `FAQ ${i + 1}`)}>
                    <Copy className="h-3 w-3 me-1.5" />{t.copyQA}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function SocialCard({ title, color, fields }: {
  title: string;
  color: string;
  fields: { label: string; value: string; onCopy: () => void; muted?: boolean }[];
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />{title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {fields.map(f => (
          <div key={f.label} className="group relative">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground font-mono">{f.label}</span>
              <CopyBtn onClick={f.onCopy} className="opacity-0 group-hover:opacity-100 h-6 w-6" />
            </div>
            <p className={`text-sm ${f.muted ? "text-muted-foreground line-clamp-3" : "font-medium"}`}>{f.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ─── Helpers ─── */
function AC({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <motion.div initial="hidden" animate={show ? "visible" : "hidden"} variants={cardIn}>
      {children}
    </motion.div>
  );
}

function SP({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
      ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"
    }`}>
      <span className={ok ? "text-emerald-500" : "text-amber-500"}>{icon}</span>
      <div className="min-w-0">
        <p className="text-muted-foreground leading-none mb-0.5 truncate">{label}</p>
        <p className={`font-bold font-mono leading-none ${ok ? "text-emerald-500" : "text-amber-500"}`}>{value}</p>
      </div>
    </div>
  );
}

function CharBar({ value, min, max, label }: { value: number; min: number; max: number; label: string }) {
  const ok  = value >= min && value <= max;
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5 border-t border-border/50 pt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground">{label}</span>
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${ok ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
          {value} / {max}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${ok ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CopyBtn({ onClick, className = "", label }: { onClick: () => void; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return label ? (
    <Button variant="ghost" size="sm" className={`h-8 text-xs font-mono text-muted-foreground hover:text-primary ${className}`}
      onClick={() => { onClick(); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
      {copied ? <Check className="h-3 w-3 me-1.5" /> : <Copy className="h-3 w-3 me-1.5" />}
      {copied ? "Copied" : label}
    </Button>
  ) : (
    <Button variant="ghost" size="icon"
      className={`h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors ${className}`}
      onClick={() => { onClick(); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}
