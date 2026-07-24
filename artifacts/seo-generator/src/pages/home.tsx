import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  Copy, Terminal, Loader2, Check, Sun, Moon, Languages,
  TrendingUp, Hash, HelpCircle, FileText,
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
import { translations, type UiLang } from "@/lib/i18n";

/* ─── Schema ─── */
const formSchema = z.object({
  serviceName: z.string().min(2).max(200),
  language:    z.enum(["ar", "en"]),
  tone:        z.enum(["professional", "friendly", "persuasive"]),
  provider:    z.enum(["openai", "gemini", "qwen", "zhipu"]),
});
type FormValues = z.infer<typeof formSchema>;

/* ─── Animation helpers ─── */
const cardVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* ─── SEO score calculator ─── */
function calcSeoScore(r: SeoResult) {
  const titleOk   = r.title.length >= 50 && r.title.length <= 60;
  const metaOk    = r.metaDescription.length >= 150 && r.metaDescription.length <= 160;
  const kwOk      = r.keywords.length >= 8;
  const faqOk     = r.faqItems.length >= 3;

  const titleScore = titleOk ? 25 : r.title.length > 30 ? 15 : r.title.length > 0 ? 8 : 0;
  const metaScore  = metaOk  ? 25 : r.metaDescription.length > 80 ? 15 : r.metaDescription.length > 0 ? 8 : 0;
  const kwScore    = kwOk    ? 25 : Math.min(r.keywords.length * 3, 20);
  const faqScore   = faqOk   ? 25 : Math.min(r.faqItems.length * 8, 20);

  return {
    score: titleScore + metaScore + kwScore + faqScore,
    titleOk, metaOk, kwOk, faqOk,
    totalWords: [r.title, r.metaDescription, r.slogan, r.ogDescription]
      .join(" ").split(/\s+/).filter(Boolean).length,
    totalChars: r.title.length + r.metaDescription.length + r.slogan.length,
  };
}

/* ─── Home ─── */
export default function Home() {
  const { toast }                 = useToast();
  const { theme, toggleTheme }    = useLocalTheme();
  const generateSeo               = useGenerateSeo();
  const [result, setResult]       = useState<SeoResult | null>(null);
  const [uiLang, setUiLang]       = useState<UiLang>(() => {
    try { return (localStorage.getItem("ui-lang") as UiLang) || "ar"; }
    catch { return "ar"; }
  });

  const t       = translations[uiLang];
  const isUiRtl = uiLang === "ar";

  useEffect(() => {
    try { localStorage.setItem("ui-lang", uiLang); } catch { /**/ }
  }, [uiLang]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { serviceName: "", language: "ar", tone: "professional", provider: "openai" },
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
  const copyAllKeywords = (kw: string[]) => {
    navigator.clipboard.writeText(kw.join(", "));
    toast({ title: t.copied, description: t.copiedDesc });
  };

  return (
    <div
      dir={isUiRtl ? "rtl" : "ltr"}
      className="flex h-screen w-full flex-col md:flex-row bg-background text-foreground overflow-hidden"
    >
      {/* ── Sidebar ── */}
      <aside className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-e border-border bg-sidebar flex flex-col h-full z-10 shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-primary">
              <div className="p-2 bg-primary/10 rounded-md ring-1 ring-primary/20">
                <Terminal className="h-4 w-4" />
              </div>
              <h1 className="font-semibold text-base tracking-tight text-sidebar-foreground">
                {t.appName}
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-mono text-muted-foreground hover:text-primary" onClick={() => setUiLang(l => l === "ar" ? "en" : "ar")}>
                <Languages className="h-3.5 w-3.5 me-1" />
                {t.uiLangToggle}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono">{t.status}</p>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Service Name */}
              <FormField control={form.control} name="serviceName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                    {t.targetLabel}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.targetPlaceholder}
                      dir={isUiRtl ? "rtl" : "ltr"}
                      {...field}
                      className="font-medium bg-background border-border/50 focus-visible:ring-primary h-11"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">{t.targetDescription}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Language + Tone */}
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="language" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                      {t.outputLangLabel}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-background border-border/50 text-sm">
                          <SelectValue />
                        </SelectTrigger>
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
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                      {t.voiceToneLabel}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-background border-border/50 text-sm">
                          <SelectValue />
                        </SelectTrigger>
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

              {/* Provider */}
              <FormField control={form.control} name="provider" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                    {t.providerLabel}
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 bg-background border-border/50 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="openai">{t.providers.openai}</SelectItem>
                      <SelectItem value="gemini">{t.providers.gemini}</SelectItem>
                      <SelectItem value="qwen">{t.providers.qwen}</SelectItem>
                      <SelectItem value="zhipu">{t.providers.zhipu}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              {/* Submit */}
              <div className="pt-3 border-t border-border/50">
                <Button
                  type="submit"
                  disabled={generateSeo.isPending}
                  className="w-full h-11 text-sm font-semibold tracking-wide uppercase shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] group relative overflow-hidden transition-all"
                >
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

      {/* ── Results pane ── */}
      <main className="flex-1 bg-background overflow-y-auto p-6 md:p-8 lg:p-10">
        <div className="min-h-full">
          {generateSeo.isPending ? (
            <LoadingSkeleton />
          ) : !result ? (
            <EmptyState t={t} />
          ) : (
            <ResultsView
              result={result}
              isOutputRtl={isOutputRtl}
              form={form}
              t={t}
              handleCopy={handleCopy}
              copyAllKeywords={copyAllKeywords}
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
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyState({ t }: { t: typeof translations["en"] }) {
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

/* ─── Results view (one-by-one reveal) ─── */
function ResultsView({
  result, isOutputRtl, form, t, handleCopy, copyAllKeywords,
}: {
  result: SeoResult;
  isOutputRtl: boolean;
  form: ReturnType<typeof useForm<FormValues>>;
  t: typeof translations["en"];
  handleCopy: (text: string, field: string) => void;
  copyAllKeywords: (kw: string[]) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const TOTAL_CARDS = 8;

  useEffect(() => {
    setVisibleCount(0);
    let count = 0;
    const id = setInterval(() => {
      count++;
      setVisibleCount(count);
      if (count >= TOTAL_CARDS) clearInterval(id);
    }, 180);
    return () => clearInterval(id);
  }, [result]);

  const stats  = calcSeoScore(result);
  const lang   = form.getValues("language") === "ar" ? t.langOptions.ar : t.langOptions.en;
  const toneK  = form.getValues("tone") as keyof typeof t.toneOptions;
  const tone   = t.toneOptions[toneK];

  const scoreColor =
    stats.score >= 80 ? "text-emerald-500" :
    stats.score >= 55 ? "text-yellow-500"  : "text-red-500";
  const scoreBg =
    stats.score >= 80 ? "bg-emerald-500/10 border-emerald-500/30" :
    stats.score >= 55 ? "bg-yellow-500/10 border-yellow-500/30"   : "bg-red-500/10 border-red-500/30";

  const show = (i: number) => i < visibleCount;

  return (
    <div dir={isOutputRtl ? "rtl" : "ltr"} className="max-w-4xl mx-auto space-y-5 pb-20">

      {/* 0 — Header row */}
      <AnimateCard show={show(0)}>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t.generatedTitle}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{t.optimizedFor} {lang} · {tone}</p>
          </div>
          <Badge variant="outline" className="font-mono text-primary border-primary/40 bg-primary/10 px-3 py-1 text-xs">
            {t.statusSuccess}
          </Badge>
        </div>
      </AnimateCard>

      {/* 1 — SEO Stats panel */}
      <AnimateCard show={show(1)}>
        <div className={`rounded-xl border p-4 ${scoreBg}`}>
          <p className="text-xs uppercase tracking-wider font-mono text-muted-foreground mb-3">
            {t.statsTitle}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
            {/* Score */}
            <div className="md:col-span-1 flex flex-col items-center justify-center py-2">
              <span className={`text-4xl font-bold tabular-nums ${scoreColor}`}>{stats.score}</span>
              <span className="text-xs text-muted-foreground mt-0.5 font-mono">/ 100</span>
              <span className="text-xs font-medium mt-1 text-muted-foreground">{t.seoScore}</span>
            </div>
            {/* Divider */}
            <div className="hidden md:block md:col-span-1 h-full border-s border-border/40 mx-2" />
            {/* Stat pills */}
            <div className="md:col-span-3 grid grid-cols-2 gap-2">
              <StatPill icon={<FileText className="h-3.5 w-3.5" />} label={t.titleStat} value={`${result.title.length} ${t.lengthLabel}`} ok={stats.titleOk} />
              <StatPill icon={<FileText className="h-3.5 w-3.5" />} label={t.metaStat} value={`${result.metaDescription.length} ${t.lengthLabel}`} ok={stats.metaOk} />
              <StatPill icon={<Hash className="h-3.5 w-3.5" />} label={t.keywordsStat} value={`${result.keywords.length}`} ok={stats.kwOk} />
              <StatPill icon={<HelpCircle className="h-3.5 w-3.5" />} label={t.faqStat} value={`${result.faqItems.length}`} ok={stats.faqOk} />
            </div>
          </div>
          {/* Word + char totals */}
          <div className="mt-3 pt-3 border-t border-border/30 flex gap-6 text-xs text-muted-foreground font-mono">
            <span><TrendingUp className="inline h-3 w-3 me-1" />{t.totalWords}: <strong className="text-foreground">{stats.totalWords}</strong></span>
            <span><Hash className="inline h-3 w-3 me-1" />{t.totalChars}: <strong className="text-foreground">{stats.totalChars}</strong></span>
          </div>
        </div>
      </AnimateCard>

      {/* 2 — Slogan */}
      <AnimateCard show={show(2)}>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-transparent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-500" />
          <Card className="relative bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.sloganLabel}</CardTitle>
              <CopyButton onClick={() => handleCopy(result.slogan, t.sloganLabel)} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-3xl font-medium leading-tight">{result.slogan}</p>
            </CardContent>
          </Card>
        </div>
      </AnimateCard>

      {/* 3 — Title + Slug */}
      <AnimateCard show={show(3)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="flex flex-col border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.pageTitleLabel}</CardTitle>
              <CopyButton onClick={() => handleCopy(result.title, t.pageTitleLabel)} />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-4">
              <p className="text-base leading-snug">{result.title}</p>
              <CharCounter value={result.title.length} min={50} max={60} label={t.lengthLabel} />
            </CardContent>
          </Card>
          <Card className="flex flex-col border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.slugLabel}</CardTitle>
              <CopyButton onClick={() => handleCopy(result.canonicalSlug, t.slugLabel)} />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              <div className="p-3 bg-secondary rounded-md overflow-x-auto border border-border" dir="ltr">
                <code className="text-sm font-mono text-primary/90 whitespace-nowrap">/{result.canonicalSlug}</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimateCard>

      {/* 4 — Meta Description */}
      <AnimateCard show={show(4)}>
        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.metaDescLabel}</CardTitle>
            <CopyButton onClick={() => handleCopy(result.metaDescription, t.metaDescLabel)} />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{result.metaDescription}</p>
            <CharCounter value={result.metaDescription.length} min={150} max={160} label={t.lengthLabel} />
          </CardContent>
        </Card>
      </AnimateCard>

      {/* 5 — Keywords */}
      <AnimateCard show={show(5)}>
        <Card className="border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.keywordsLabel}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => copyAllKeywords(result.keywords)} className="h-8 text-xs font-mono text-muted-foreground hover:text-primary">
              <Copy className="h-3 w-3 me-1.5" />{t.copyAll}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((kw, i) => (
                <Badge key={i} variant="secondary"
                  className="px-3 py-1 font-normal bg-secondary border border-border/50 text-foreground/80 hover:bg-secondary/80 cursor-pointer transition-colors"
                  onClick={() => handleCopy(kw, kw)}>
                  {kw}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimateCard>

      {/* 6 — Open Graph + Twitter */}
      <AnimateCard show={show(6)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />{t.ogLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FieldRow label="og:title"       value={result.ogTitle}       onCopy={() => handleCopy(result.ogTitle, "og:title")} />
              <FieldRow label="og:description" value={result.ogDescription} onCopy={() => handleCopy(result.ogDescription, "og:description")} muted />
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-400" />{t.twitterLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FieldRow label="twitter:title"       value={result.twitterTitle}       onCopy={() => handleCopy(result.twitterTitle, "twitter:title")} />
              <FieldRow label="twitter:description" value={result.twitterDescription} onCopy={() => handleCopy(result.twitterDescription, "twitter:description")} muted />
            </CardContent>
          </Card>
        </div>
      </AnimateCard>

      {/* 7 — FAQ */}
      {result.faqItems?.length > 0 && (
        <AnimateCard show={show(7)}>
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{t.faqLabel}</CardTitle>
              <Button variant="ghost" size="sm"
                onClick={() => {
                  const jsonLd = {
                    "@context": "https://schema.org", "@type": "FAQPage",
                    mainEntity: result.faqItems.map(f => ({
                      "@type": "Question", name: f.question,
                      acceptedAnswer: { "@type": "Answer", text: f.answer },
                    })),
                  };
                  handleCopy(JSON.stringify(jsonLd, null, 2), "FAQ JSON-LD");
                }}
                className="h-8 text-xs font-mono text-muted-foreground hover:text-primary">
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
                        <Button variant="outline" size="sm"
                          className="self-start text-xs h-7 bg-transparent border-border/50"
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
        </AnimateCard>
      )}
    </div>
  );
}

/* ─── Animated card wrapper ─── */
function AnimateCard({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate={show ? "visible" : "hidden"}
      variants={cardVariants}
    >
      {children}
    </motion.div>
  );
}

/* ─── Stat pill ─── */
function StatPill({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
      ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-yellow-500/30 bg-yellow-500/5"
    }`}>
      <span className={ok ? "text-emerald-500" : "text-yellow-500"}>{icon}</span>
      <div className="min-w-0">
        <p className="text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className={`font-semibold font-mono leading-none ${ok ? "text-emerald-500" : "text-yellow-500"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── Char counter ─── */
function CharCounter({ value, min, max, label }: { value: number; min: number; max: number; label: string }) {
  const ok = value >= min && value <= max;
  return (
    <div className="flex items-center justify-between border-t border-border/50 pt-3">
      <span className="text-xs font-mono text-muted-foreground">{label}</span>
      <span className={`text-xs font-mono px-2 py-0.5 rounded ${ok ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"}`}>
        {value} / {max}
      </span>
    </div>
  );
}

/* ─── Field row ─── */
function FieldRow({ label, value, onCopy, muted = false }: { label: string; value: string; onCopy: () => void; muted?: boolean }) {
  return (
    <div className="group relative">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground font-mono">{label}</span>
        <CopyButton onClick={onCopy} className="opacity-0 group-hover:opacity-100 h-6 w-6" />
      </div>
      <p className={`text-sm ${muted ? "text-muted-foreground line-clamp-3" : "font-medium"}`}>{value}</p>
    </div>
  );
}

/* ─── Copy button ─── */
function CopyButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button variant="ghost" size="icon"
      className={`h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors ${className}`}
      onClick={() => { onClick(); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}
