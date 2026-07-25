import { useState, useEffect, CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import {
  Copy, Terminal, Loader2, Check, Sun, Moon, Languages,
  TrendingUp, Hash, HelpCircle, FileText, Settings,
  ChevronDown, ChevronUp, Globe, Brain, BarChart3, Search,
  ShieldCheck, List, Eye, Sparkles,
} from "lucide-react";
import { useLocalTheme } from "@/hooks/use-theme";
import { useGenerateSeo } from "@workspace/api-client-react";
import type { SeoResult } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { translations, type UiLang, type Translations } from "@/lib/i18n";

/* ─── Types ─── */
type ExtendedResult = SeoResult & {
  schemaMarkups?: Array<{ schemaType: string; label: string; jsonLd: string; priority?: string }>;
  geoContent?: {
    directAnswer: string; featuredSnippet: string;
    peopleAlsoAsk: Array<{ question: string; answer: string }>;
    voiceSearchQuery: string; aiOverviewTips: string[];
  };
  technicalChecklist?: Array<{ category: string; item: string; priority: string; status: string; description?: string }>;
  serpPreview?: { displayUrl: string; breadcrumb: string; titlePreview: string; descriptionPreview: string; richResultEligible?: string[]; estimatedCtr?: string };
  contentBrief?: {
    recommendedWordCount: number; suggestedH1: string;
    sections: Array<{ heading: string; headingLevel: string; purpose?: string; wordCount?: number; keywordsToInclude?: string[] }>;
    internalLinkSuggestions?: string[]; competitorTopics?: string[];
  };
  eeatSignals?: { experienceSignals: string[]; expertiseSignals: string[]; authoritativenessSignals: string[]; trustSignals: string[]; overallScore?: number };
  semanticKeywords?: Array<{ keyword: string; intent: string; relevanceScore: number; isLsi?: boolean }>;
};

/* ─── Form schema ─── */
const formSchema = z.object({
  serviceName:    z.string().min(2).max(200),
  language:       z.enum(["ar", "en"]),
  tone:           z.enum(["professional", "friendly", "persuasive"]),
  provider:       z.enum(["openai", "gemini", "qwen", "zhipu"]),
  businessType:   z.string().default("local"),
  targetAudience: z.string().default(""),
  location:       z.string().default(""),
});
type FormValues = z.infer<typeof formSchema>;

/* ─── SEO score calculator ─── */
function calcSeoScore(r: ExtendedResult) {
  const titleOk  = r.title.length >= 50 && r.title.length <= 60;
  const metaOk   = r.metaDescription.length >= 150 && r.metaDescription.length <= 160;
  const kwOk     = r.keywords.length >= 8;
  const faqOk    = r.faqItems.length >= 3;
  const schemaOk = (r.schemaMarkups?.length ?? 0) >= 2;
  const semanticOk = (r.semanticKeywords?.length ?? 0) >= 4;

  const s =
    (titleOk  ? 20 : r.title.length > 30 ? 12 : 5) +
    (metaOk   ? 20 : r.metaDescription.length > 80 ? 12 : 5) +
    (kwOk     ? 20 : Math.min(r.keywords.length * 2, 15)) +
    (faqOk    ? 20 : Math.min(r.faqItems.length * 6, 15)) +
    (schemaOk ? 10 : Math.min((r.schemaMarkups?.length ?? 0) * 4, 8)) +
    (semanticOk ? 10 : Math.min((r.semanticKeywords?.length ?? 0) * 2, 7));

  const totalWords = [r.title, r.metaDescription, r.slogan, r.ogDescription]
    .join(" ").split(/\s+/).filter(Boolean).length;

  return { score: s, titleOk, metaOk, kwOk, faqOk, schemaOk, semanticOk, totalWords };
}

/* ─── Pure-CSS animated card ─── */
function FadeCard({ show, children, className = "" }: { show: boolean; children: React.ReactNode; className?: string }) {
  const style: CSSProperties = {
    opacity:    show ? 1 : 0,
    transform:  show ? "translateY(0)" : "translateY(18px)",
    transition: "opacity 0.38s ease-out, transform 0.38s ease-out",
    pointerEvents: show ? "auto" : "none",
  };
  return <div style={style} className={className}>{children}</div>;
}

/* ─── Home ─── */
export default function Home() {
  const { toast }              = useToast();
  const { theme, toggleTheme } = useLocalTheme();
  const generateSeo            = useGenerateSeo();
  const [result, setResult]    = useState<ExtendedResult | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [uiLang, setUiLang]    = useState<UiLang>(() => {
    try { return (localStorage.getItem("ui-lang") as UiLang) || "ar"; } catch { return "ar"; }
  });

  const t       = translations[uiLang] as Translations;
  const isUiRtl = uiLang === "ar";

  useEffect(() => {
    try { localStorage.setItem("ui-lang", uiLang); } catch { /**/ }
  }, [uiLang]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { serviceName: "", language: "ar", tone: "professional", provider: "gemini", businessType: "local", targetAudience: "", location: "" },
  });

  const isOutputRtl = form.watch("language") === "ar";

  function onSubmit(values: FormValues) {
    generateSeo.mutate({ data: values }, {
      onSuccess: (data) => {
        setResult(data as ExtendedResult);
        toast({ title: t.generationComplete, description: t.generationSuccess });
      },
      onError: (err: unknown) => {
        const msg = (err as { data?: { error?: string } })?.data?.error ?? t.errorDesc;
        toast({ title: t.errorTitle, description: msg, variant: "destructive" });
      },
    });
  }

  const cp = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t.copied, description: `${label} ${t.copiedDesc}` });
  };

  return (
    <div dir={isUiRtl ? "rtl" : "ltr"}
      className="flex h-screen w-full flex-col md:flex-row bg-background text-foreground overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-e border-border bg-sidebar flex flex-col h-full z-10 shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-md ring-1 ring-primary/20">
                <Terminal className="h-4 w-4 text-primary" />
              </div>
              <h1 className="font-semibold text-base tracking-tight text-sidebar-foreground">{t.appName}</h1>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-mono text-muted-foreground hover:text-primary"
                onClick={() => setUiLang(l => l === "ar" ? "en" : "ar")}>
                <Languages className="h-3.5 w-3.5 me-1" />{t.uiLangToggle}
              </Button>
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title={isUiRtl ? "إعدادات المزودين" : "Provider Settings"}>
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono">{t.status}</p>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Service name */}
              <FormField control={form.control} name="serviceName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.targetLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.targetPlaceholder} dir={isUiRtl ? "rtl" : "ltr"}
                      {...field} className="font-medium bg-background border-border/50 focus-visible:ring-primary h-11" />
                  </FormControl>
                  <FormDescription className="text-xs">{t.targetDescription}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Business Type */}
              <FormField control={form.control} name="businessType" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.businessTypeLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 bg-background border-border/50 text-sm"><SelectValue /></SelectTrigger>
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
                      <FormControl><SelectTrigger className="h-10 bg-background border-border/50 text-sm"><SelectValue /></SelectTrigger></FormControl>
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
                      <FormControl><SelectTrigger className="h-10 bg-background border-border/50 text-sm"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="professional">{t.toneOptions.professional}</SelectItem>
                        <SelectItem value="persuasive">{t.toneOptions.persuasive}</SelectItem>
                        <SelectItem value="friendly">{t.toneOptions.friendly}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              {/* Provider */}
              <FormField control={form.control} name="provider" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.providerLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="h-10 bg-background border-border/50 text-sm"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="gemini">{t.providers.gemini}</SelectItem>
                      <SelectItem value="qwen">{t.providers.qwen}</SelectItem>
                      <SelectItem value="zhipu">{t.providers.zhipu}</SelectItem>
                      <SelectItem value="openai">{t.providers.openai}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              {/* Advanced toggle */}
              <button type="button" onClick={() => setAdvanced(a => !a)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-full py-1">
                {advanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {isUiRtl ? "إعدادات متقدمة (اختياري)" : "Advanced options (optional)"}
              </button>

              {advanced && (
                <div className="space-y-3 border border-border/40 rounded-lg p-3 bg-secondary/30">
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t.locationLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.locationPlaceholder} {...field} className="h-9 bg-background border-border/50 text-sm" />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="targetAudience" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t.audienceLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.audiencePlaceholder} {...field} className="h-9 bg-background border-border/50 text-sm" />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 border-t border-border/50">
                <Button type="submit" disabled={generateSeo.isPending}
                  className="w-full h-11 text-sm font-semibold tracking-wide uppercase shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] group relative overflow-hidden transition-all">
                  <div className="absolute inset-0 bg-primary/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center gap-2">
                    {generateSeo.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin" />{t.processing}</>
                      : <><Terminal className="h-4 w-4" />{t.executeBtn}</>}
                  </span>
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </aside>

      {/* ── Main results ── */}
      <main className="flex-1 bg-background overflow-y-auto p-6 md:p-8 lg:p-10">
        {generateSeo.isPending ? <LoadingSkeleton /> :
         !result            ? <EmptyState t={t} /> :
         <ResultsView result={result} isOutputRtl={isOutputRtl} form={form} t={t} cp={cp} />}
      </main>
    </div>
  );
}

/* ─── Loading skeleton ─── */
function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <Skeleton className="h-14 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0,1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      {[1,2,3,4,5].map(i => <Skeleton key={i} className={`h-${i % 2 === 0 ? 32 : 24} rounded-xl`} />)}
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyState({ t }: { t: Translations }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4 max-w-xs mx-auto">
      <div className="w-14 h-14 rounded-full border border-dashed border-muted-foreground flex items-center justify-center">
        <Terminal className="w-5 h-5 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-medium tracking-tight">{t.standbyTitle}</h2>
      <p className="text-sm text-muted-foreground font-mono leading-relaxed">{t.standbyDesc}</p>
    </div>
  );
}

/* ─── Results view with one-by-one reveal ─── */
function ResultsView({ result, isOutputRtl, form, t, cp }: {
  result: ExtendedResult;
  isOutputRtl: boolean;
  form: ReturnType<typeof useForm<FormValues>>;
  t: Translations;
  cp: (text: string, label: string) => void;
}) {
  const TOTAL = 16;
  const [vis, setVis] = useState(0);

  useEffect(() => {
    setVis(0);
    let n = 0;
    const id = setInterval(() => { n++; setVis(n); if (n >= TOTAL) clearInterval(id); }, 160);
    return () => clearInterval(id);
  }, [result]);

  const stats = calcSeoScore(result);
  const lang  = form.getValues("language") === "ar" ? t.langOptions.ar : t.langOptions.en;
  const toneK = form.getValues("tone") as keyof typeof t.toneOptions;

  const scoreColor = stats.score >= 80 ? "text-emerald-500" : stats.score >= 55 ? "text-yellow-500" : "text-red-500";
  const scoreBg    = stats.score >= 80 ? "bg-emerald-500/10 border-emerald-500/30" : stats.score >= 55 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30";

  const s = (i: number) => i < vis;

  return (
    <div dir={isOutputRtl ? "rtl" : "ltr"} className="max-w-5xl mx-auto space-y-5 pb-20">

      {/* 0 — Header */}
      <FadeCard show={s(0)}>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t.generatedTitle}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{t.optimizedFor} {lang} · {t.toneOptions[toneK]}</p>
          </div>
          <Badge variant="outline" className="font-mono text-primary border-primary/40 bg-primary/10 px-3 py-1 text-xs">
            {t.statusSuccess}
          </Badge>
        </div>
      </FadeCard>

      {/* 1 — SEO Stats */}
      <FadeCard show={s(1)}>
        <div className={`rounded-xl border p-4 ${scoreBg}`}>
          <p className="text-xs uppercase tracking-wider font-mono text-muted-foreground mb-3 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />{t.statsTitle}
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Score circle */}
            <div className="flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 border-current shrink-0" style={{ borderColor: "currentColor" }}>
              <span className={`text-3xl font-bold tabular-nums ${scoreColor}`}>{stats.score}</span>
              <span className="text-[10px] text-muted-foreground font-mono">/ 100</span>
            </div>
            {/* Pills */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <StatPill icon={<FileText className="h-3 w-3"/>} label={t.titleStat}    value={`${result.title.length}/60`}                ok={stats.titleOk}   />
              <StatPill icon={<FileText className="h-3 w-3"/>} label={t.metaStat}     value={`${result.metaDescription.length}/160`}     ok={stats.metaOk}    />
              <StatPill icon={<Hash className="h-3 w-3"/>}     label={t.keywordsStat} value={`${result.keywords.length}`}               ok={stats.kwOk}      />
              <StatPill icon={<HelpCircle className="h-3 w-3"/>} label={t.faqStat}   value={`${result.faqItems.length}`}               ok={stats.faqOk}     />
              <StatPill icon={<Globe className="h-3 w-3"/>}    label={t.schemaStat}  value={`${result.schemaMarkups?.length ?? 0}`}    ok={stats.schemaOk}  />
              <StatPill icon={<Brain className="h-3 w-3"/>}    label={t.semanticStat} value={`${result.semanticKeywords?.length ?? 0}`} ok={stats.semanticOk} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/30 flex gap-6 text-xs text-muted-foreground font-mono">
            <span><TrendingUp className="inline h-3 w-3 me-1"/>{t.totalWords}: <strong className="text-foreground">{stats.totalWords}</strong></span>
            <span><Hash className="inline h-3 w-3 me-1"/>{t.totalChars}: <strong className="text-foreground">{result.title.length + result.metaDescription.length}</strong></span>
          </div>
        </div>
      </FadeCard>

      {/* 2 — Slogan */}
      <FadeCard show={s(2)}>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-transparent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-500"/>
          <Card className="relative bg-card/80 border-primary/20">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5"/>{t.sloganLabel}</CardTitle>
              <CopyBtn onClick={() => cp(result.slogan, t.sloganLabel)}/>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-3xl font-medium leading-tight">{result.slogan}</p>
            </CardContent>
          </Card>
        </div>
      </FadeCard>

      {/* 3 — Title + Slug */}
      <FadeCard show={s(3)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/50 hover:border-primary/30 transition-colors flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.pageTitleLabel}</CardTitle>
              <CopyBtn onClick={() => cp(result.title, t.pageTitleLabel)}/>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-3">
              <p className="text-sm font-medium leading-snug">{result.title}</p>
              <CharBar value={result.title.length} min={50} max={60} label={t.lengthLabel}/>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:border-primary/30 transition-colors flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.slugLabel}</CardTitle>
              <CopyBtn onClick={() => cp(result.canonicalSlug, t.slugLabel)}/>
            </CardHeader>
            <CardContent className="flex-1 flex items-center">
              <div className="p-2.5 bg-secondary rounded-md overflow-x-auto border border-border w-full" dir="ltr">
                <code className="text-sm font-mono text-primary/90 whitespace-nowrap">/{result.canonicalSlug}</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeCard>

      {/* 4 — Meta Description */}
      <FadeCard show={s(4)}>
        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.metaDescLabel}</CardTitle>
            <CopyBtn onClick={() => cp(result.metaDescription, t.metaDescLabel)}/>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">{result.metaDescription}</p>
            <CharBar value={result.metaDescription.length} min={150} max={160} label={t.lengthLabel}/>
          </CardContent>
        </Card>
      </FadeCard>

      {/* 5 — Keywords */}
      <FadeCard show={s(5)}>
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5"><Hash className="h-3.5 w-3.5"/>{t.keywordsLabel}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => cp(result.keywords.join(", "), t.keywordsLabel)}
              className="h-8 text-xs font-mono text-muted-foreground hover:text-primary">
              <Copy className="h-3 w-3 me-1.5"/>{t.copyAll}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((kw, i) => (
                <Badge key={i} variant="secondary" onClick={() => cp(kw, kw)}
                  className="px-3 py-1 font-normal border border-border/50 hover:bg-primary/10 hover:border-primary/30 cursor-pointer transition-colors">
                  {kw}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeCard>

      {/* 6 — Semantic / LSI Keywords */}
      {result.semanticKeywords && result.semanticKeywords.length > 0 && (
        <FadeCard show={s(6)}>
          <Card className="border-border/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5"><Brain className="h-3.5 w-3.5"/>{t.semanticLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.semanticKeywords.map((sk, i) => {
                  const intentColor =
                    sk.intent === "transactional" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" :
                    sk.intent === "informational"  ? "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400" :
                    sk.intent === "commercial"     ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400" :
                    "border-border/50 text-muted-foreground";
                  return (
                    <span key={i} onClick={() => cp(sk.keyword, sk.keyword)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-pointer hover:opacity-80 transition-opacity ${intentColor}`}>
                      {sk.keyword}
                      <span className="opacity-60 font-mono text-[10px]">{(t.intentLabels as Record<string, string>)[sk.intent]}</span>
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </FadeCard>
      )}

      {/* 7 — OG + Twitter */}
      <FadeCard show={s(7)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"/>{t.ogLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              <FieldRow label="og:title"       value={result.ogTitle}       onCopy={() => cp(result.ogTitle, "og:title")}/>
              <FieldRow label="og:description" value={result.ogDescription} onCopy={() => cp(result.ogDescription, "og:description")} muted/>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-400"/>{t.twitterLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              <FieldRow label="twitter:title"       value={result.twitterTitle}       onCopy={() => cp(result.twitterTitle, "twitter:title")}/>
              <FieldRow label="twitter:description" value={result.twitterDescription} onCopy={() => cp(result.twitterDescription, "twitter:description")} muted/>
            </CardContent>
          </Card>
        </div>
      </FadeCard>

      {/* 8 — SERP Preview */}
      {result.serpPreview && (
        <FadeCard show={s(8)}>
          <Card className="border-border/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5"><Eye className="h-3.5 w-3.5"/>{t.serpLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Google SERP mockup */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-border/50 p-4 space-y-1" dir="ltr">
                <p className="text-[11px] text-muted-foreground font-mono">{result.serpPreview.displayUrl}</p>
                <p className="text-[17px] text-blue-600 dark:text-blue-400 font-medium leading-tight hover:underline cursor-pointer">
                  {result.serpPreview.titlePreview || result.title}
                </p>
                <p className="text-sm text-muted-foreground leading-snug">{result.serpPreview.descriptionPreview || result.metaDescription}</p>
              </div>
              {result.serpPreview.richResultEligible && result.serpPreview.richResultEligible.length > 0 && (
                <div className="mt-3 flex items-center flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">{t.richResultsLabel}:</span>
                  {result.serpPreview.richResultEligible.map((r, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">{r}</Badge>
                  ))}
                  {result.serpPreview.estimatedCtr && (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/5 text-emerald-600">
                      CTR: {result.serpPreview.estimatedCtr}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeCard>
      )}

      {/* 9 — Schema Markups */}
      {result.schemaMarkups && result.schemaMarkups.length > 0 && (
        <FadeCard show={s(9)}>
          <Card className="border-border/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5"><Globe className="h-3.5 w-3.5"/>{t.schemaLabel}</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t.schemaDesc}</p>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {result.schemaMarkups.map((s_, i) => (
                  <AccordionItem key={i} value={`schema-${i}`} className="border-border/50">
                    <AccordionTrigger className="text-sm hover:text-primary text-start py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${
                          s_.priority === "high" || s_.priority === "critical" ? "border-primary/30 bg-primary/5 text-primary" : "border-border"
                        }`}>{s_.schemaType}</Badge>
                        <span className="font-normal text-muted-foreground">{s_.label}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="relative">
                        <pre className="text-xs font-mono bg-secondary/50 rounded-lg p-3 overflow-x-auto border border-border/50 max-h-48 leading-relaxed" dir="ltr">
                          {(() => { try { return JSON.stringify(JSON.parse(s_.jsonLd), null, 2); } catch { return s_.jsonLd; } })()}
                        </pre>
                        <Button size="sm" variant="outline"
                          className="mt-2 h-7 text-xs border-border/50 bg-transparent"
                          onClick={() => cp(s_.jsonLd, s_.label)}>
                          <Copy className="h-3 w-3 me-1.5"/>{t.copySchema}
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </FadeCard>
      )}

      {/* 10 — GEO Content */}
      {result.geoContent && (
        <FadeCard show={s(10)}>
          <Card className="border-border/50 border-violet-500/20">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500"/>{t.geoLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Direct Answer */}
              <div className="group relative">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider">{t.directAnswerLabel}</p>
                  <CopyBtn onClick={() => cp(result.geoContent!.directAnswer, t.directAnswerLabel)} className="opacity-0 group-hover:opacity-100"/>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground border-s-2 border-violet-500/50 ps-3">{result.geoContent.directAnswer}</p>
              </div>
              {/* Featured Snippet */}
              <div className="group relative">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">{t.featuredSnippetLabel}</p>
                  <CopyBtn onClick={() => cp(result.geoContent!.featuredSnippet, t.featuredSnippetLabel)} className="opacity-0 group-hover:opacity-100"/>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                  <p className="text-sm leading-relaxed">{result.geoContent.featuredSnippet}</p>
                </div>
              </div>
              {/* Voice Search */}
              {result.geoContent.voiceSearchQuery && (
                <div className="group relative flex items-start gap-3">
                  <span className="text-lg mt-0.5">🎤</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t.voiceSearchLabel}</p>
                    <p className="text-sm italic text-foreground/80">"{result.geoContent.voiceSearchQuery}"</p>
                  </div>
                  <CopyBtn onClick={() => cp(result.geoContent!.voiceSearchQuery, t.voiceSearchLabel)} className="opacity-0 group-hover:opacity-100"/>
                </div>
              )}
              {/* PAA */}
              {result.geoContent.peopleAlsoAsk && result.geoContent.peopleAlsoAsk.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.paaLabel}</p>
                  <Accordion type="single" collapsible className="w-full">
                    {result.geoContent.peopleAlsoAsk.map((paa, i) => (
                      <AccordionItem key={i} value={`paa-${i}`} className="border-border/50">
                        <AccordionTrigger className="text-sm hover:text-primary text-start py-2.5">{paa.question}</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">{paa.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
              {/* AI Overview Tips */}
              {result.geoContent.aiOverviewTips && result.geoContent.aiOverviewTips.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.aiOverviewTipsLabel}</p>
                  <ul className="space-y-1.5">
                    {result.geoContent.aiOverviewTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-0.5 shrink-0">→</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeCard>
      )}

      {/* 11 — Content Brief */}
      {result.contentBrief && (
        <FadeCard show={s(11)}>
          <Card className="border-border/50">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5"><List className="h-3.5 w-3.5"/>{t.contentBriefLabel}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Word count + H1 */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground text-xs">{t.wordCountLabel}:</span>
                  <Badge variant="outline" className="font-mono border-primary/30 bg-primary/5 text-primary">
                    {result.contentBrief.recommendedWordCount.toLocaleString()} {t.words}
                  </Badge>
                </div>
              </div>
              {result.contentBrief.suggestedH1 && (
                <div className="group relative">
                  <p className="text-xs text-muted-foreground mb-1">{t.suggestedH1Label}</p>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-semibold">{result.contentBrief.suggestedH1}</p>
                    <CopyBtn onClick={() => cp(result.contentBrief!.suggestedH1, "H1")} className="opacity-0 group-hover:opacity-100 shrink-0"/>
                  </div>
                </div>
              )}
              {/* Sections */}
              {result.contentBrief.sections && result.contentBrief.sections.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{t.sectionsLabel}</p>
                  <div className="space-y-2">
                    {result.contentBrief.sections.map((sec, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/30">
                        <Badge variant="outline" className="text-[10px] shrink-0 border-border">{sec.headingLevel}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{sec.heading}</p>
                          {sec.wordCount && <p className="text-xs text-muted-foreground font-mono mt-0.5">{sec.wordCount} {t.words}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Internal links */}
              {result.contentBrief.internalLinkSuggestions && result.contentBrief.internalLinkSuggestions.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{t.internalLinksLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {result.contentBrief.internalLinkSuggestions.map((link, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-border/50 bg-secondary text-muted-foreground">
                        {link}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeCard>
      )}

      {/* 12 — E-E-A-T */}
      {result.eeatSignals && (
        <FadeCard show={s(12)}>
          <Card className="border-border/50">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5"/>{t.eeatLabel}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {result.eeatSignals.overallScore !== undefined && (
                <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{result.eeatSignals.overallScore}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">/100</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.eeatScoreLabel}</p>
                    <div className="mt-1 h-1.5 w-40 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${result.eeatSignals.overallScore}%` }}/>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "experienceSignals", label: t.experienceLabel, color: "text-blue-500" },
                  { key: "expertiseSignals",  label: t.expertiseLabel,  color: "text-emerald-500" },
                  { key: "authoritativenessSignals", label: t.authorityLabel, color: "text-violet-500" },
                  { key: "trustSignals",      label: t.trustLabel,      color: "text-amber-500" },
                ].map(({ key, label, color }) => {
                  const signals = result.eeatSignals![key as keyof typeof result.eeatSignals] as string[];
                  if (!Array.isArray(signals) || !signals.length) return null;
                  return (
                    <div key={key}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${color}`}>{label}</p>
                      <ul className="space-y-1">
                        {signals.map((sig, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <span className={`mt-0.5 shrink-0 ${color}`}>•</span>{sig}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </FadeCard>
      )}

      {/* 13 — Technical Checklist */}
      {result.technicalChecklist && result.technicalChecklist.length > 0 && (
        <FadeCard show={s(13)}>
          <Card className="border-border/50">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5"><List className="h-3.5 w-3.5"/>{t.technicalLabel}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Group by category */}
              {Array.from(new Set(result.technicalChecklist.map(i => i.category))).map(cat => (
                <div key={cat} className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</p>
                  <div className="space-y-1.5">
                    {result.technicalChecklist!.filter(i => i.category === cat).map((item, i) => {
                      const prioColor =
                        item.priority === "critical" ? "text-red-500" :
                        item.priority === "high"     ? "text-orange-500" :
                        item.priority === "medium"   ? "text-yellow-500" : "text-muted-foreground";
                      return (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/40 bg-secondary/20 hover:border-border/70 transition-colors">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${prioColor.replace("text-", "bg-")}`}/>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">{item.item}</p>
                            {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-[10px] font-mono ${prioColor}`}>
                              {(t.priorityLabels as Record<string, string>)[item.priority] ?? item.priority}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {(t.statusLabels as Record<string, string>)[item.status] ?? item.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeCard>
      )}

      {/* 14 — FAQ */}
      {result.faqItems?.length > 0 && (
        <FadeCard show={s(14)}>
          <Card className="border-border/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5"><HelpCircle className="h-3.5 w-3.5"/>{t.faqLabel}</CardTitle>
              <Button variant="ghost" size="sm"
                onClick={() => {
                  const jl = { "@context": "https://schema.org", "@type": "FAQPage",
                    mainEntity: result.faqItems.map(f => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) };
                  cp(JSON.stringify(jl, null, 2), "FAQ JSON-LD");
                }}
                className="h-8 text-xs font-mono text-muted-foreground hover:text-primary">
                <Copy className="h-3 w-3 me-1.5"/>{t.copyJsonLd}
              </Button>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {result.faqItems.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-border/50">
                    <AccordionTrigger className="text-sm font-medium hover:text-primary text-start py-3">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pt-1">
                      <div className="flex flex-col gap-2">
                        <p>{faq.answer}</p>
                        <Button variant="outline" size="sm" className="self-start h-7 text-xs bg-transparent border-border/50"
                          onClick={() => cp(`Q: ${faq.question}\nA: ${faq.answer}`, `FAQ ${i + 1}`)}>
                          <Copy className="h-3 w-3 me-1.5"/>{t.copyQA}
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </FadeCard>
      )}

      {/* 15 — Quick copy all */}
      <FadeCard show={s(15)}>
        <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-border/50 bg-secondary/20">
          <div>
            <p className="text-sm font-medium">{isOutputRtl ? "نسخ الحزمة الكاملة" : "Copy Full Package"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{isOutputRtl ? "عنوان + وصف + الكلمات + الشعار" : "Title + description + keywords + slogan"}</p>
          </div>
          <Button variant="outline" size="sm"
            onClick={() => cp([
              `Title: ${result.title}`,
              `Meta: ${result.metaDescription}`,
              `Slug: /${result.canonicalSlug}`,
              `Slogan: ${result.slogan}`,
              `Keywords: ${result.keywords.join(", ")}`,
            ].join("\n\n"), "Full Package")}
            className="h-9 text-xs bg-transparent">
            <Copy className="h-3.5 w-3.5 me-1.5"/>{t.copyAll}
          </Button>
        </div>
      </FadeCard>
    </div>
  );
}

/* ─── Stat pill ─── */
function StatPill({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs ${
      ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-yellow-500/30 bg-yellow-500/5"
    }`}>
      <span className={ok ? "text-emerald-500" : "text-yellow-500 shrink-0"}>{icon}</span>
      <div className="min-w-0">
        <p className="text-muted-foreground leading-none mb-0.5 truncate">{label}</p>
        <p className={`font-bold font-mono leading-none ${ok ? "text-emerald-500" : "text-yellow-500"}`}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Progress bar char counter ─── */
function CharBar({ value, min, max, label }: { value: number; min: number; max: number; label: string }) {
  const pct   = Math.min((value / max) * 100, 100);
  const ok    = value >= min && value <= max;
  const color = ok ? "bg-emerald-500" : value > max ? "bg-red-500" : "bg-yellow-500";
  return (
    <div className="border-t border-border/50 pt-2.5 space-y-1.5">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span className={ok ? "text-emerald-500" : "text-yellow-500"}>{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }}/>
      </div>
    </div>
  );
}

/* ─── Field row ─── */
function FieldRow({ label, value, onCopy, muted = false }: { label: string; value: string; onCopy: () => void; muted?: boolean }) {
  return (
    <div className="group relative">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground font-mono">{label}</span>
        <CopyBtn onClick={onCopy} className="opacity-0 group-hover:opacity-100 h-6 w-6"/>
      </div>
      <p className={`text-sm ${muted ? "text-muted-foreground line-clamp-3" : "font-medium"}`}>{value}</p>
    </div>
  );
}

/* ─── Copy button ─── */
function CopyBtn({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Button variant="ghost" size="icon"
      className={`h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors ${className}`}
      onClick={() => { onClick(); setOk(true); setTimeout(() => setOk(false), 1800); }}>
      {ok ? <Check className="h-4 w-4 text-emerald-500"/> : <Copy className="h-4 w-4"/>}
    </Button>
  );
}
