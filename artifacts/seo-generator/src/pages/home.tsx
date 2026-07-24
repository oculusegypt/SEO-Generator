import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Copy,
  Terminal,
  Loader2,
  Check,
  Sun,
  Moon,
  Languages,
} from "lucide-react";
import { useLocalTheme } from "@/hooks/use-theme";
import { useGenerateSeo } from "@workspace/api-client-react";
import type { SeoResult } from "@workspace/api-client-react";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { translations, type UiLang } from "@/lib/i18n";

const formSchema = z.object({
  serviceName: z.string().min(2).max(200),
  language: z.enum(["ar", "en"]),
  tone: z.enum(["professional", "friendly", "persuasive"]),
  provider: z.enum(["openai", "gemini", "qwen", "zhipu"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useLocalTheme();
  const generateSeo = useGenerateSeo();
  const [result, setResult] = useState<SeoResult | null>(null);
  const [uiLang, setUiLang] = useState<UiLang>(() => {
    try {
      return (localStorage.getItem("ui-lang") as UiLang) || "ar";
    } catch {
      return "ar";
    }
  });

  const t = translations[uiLang];
  const isUiRtl = uiLang === "ar";

  useEffect(() => {
    try {
      localStorage.setItem("ui-lang", uiLang);
    } catch {
      // ignore
    }
  }, [uiLang]);

  const toggleUiLang = () =>
    setUiLang((prev) => (prev === "ar" ? "en" : "ar"));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceName: "",
      language: "ar",
      tone: "professional",
      provider: "openai",
    },
  });

  const outputLanguage = form.watch("language");
  const isOutputRtl = outputLanguage === "ar";

  function onSubmit(values: FormValues) {
    generateSeo.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setResult(data);
          toast({
            title: t.generationComplete,
            description: t.generationSuccess,
          });
        },
        onError: (err: unknown) => {
          const msg =
            err &&
            typeof err === "object" &&
            "data" in err &&
            err.data &&
            typeof err.data === "object" &&
            "error" in err.data
              ? String((err.data as { error: string }).error)
              : t.errorDesc;
          toast({
            title: t.errorTitle,
            description: msg,
            variant: "destructive",
          });
        },
      }
    );
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t.copied,
      description: `${field} ${t.copiedDesc}`,
    });
  };

  const copyAllKeywords = (keywords: string[]) => {
    navigator.clipboard.writeText(keywords.join(", "));
    toast({ title: t.copied, description: t.copiedDesc });
  };

  return (
    <div
      dir={isUiRtl ? "rtl" : "ltr"}
      className="flex h-screen w-full flex-col md:flex-row bg-background text-foreground overflow-hidden"
    >
      {/* ─── Sidebar ─── */}
      <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-e border-border bg-sidebar flex flex-col h-full z-10 shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-primary">
              <div className="p-2 bg-primary/10 rounded-md ring-1 ring-primary/20">
                <Terminal className="h-4 w-4" />
              </div>
              <h1 className="font-semibold text-base tracking-tight text-sidebar-foreground">
                {t.appName}
              </h1>
            </div>
            {/* Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={toggleTheme}
                title={theme === "dark" ? t.themeLight : t.themeDark}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-mono text-muted-foreground hover:text-primary"
                onClick={toggleUiLang}
                title={t.uiLangToggle}
              >
                <Languages className="h-3.5 w-3.5 me-1" />
                {t.uiLangToggle}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {t.status}
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              {/* Service Name */}
              <FormField
                control={form.control}
                name="serviceName"
                render={({ field }) => (
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
                    <FormDescription className="text-xs">
                      {t.targetDescription}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Language + Tone */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                        {t.outputLangLabel}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                        {t.voiceToneLabel}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-background border-border/50 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">
                            {t.toneOptions.professional}
                          </SelectItem>
                          <SelectItem value="persuasive">
                            {t.toneOptions.persuasive}
                          </SelectItem>
                          <SelectItem value="friendly">
                            {t.toneOptions.friendly}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Provider */}
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                      {t.providerLabel}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 bg-background border-border/50 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="openai">
                          {t.providers.openai}
                        </SelectItem>
                        <SelectItem value="gemini">
                          {t.providers.gemini}
                        </SelectItem>
                        <SelectItem value="qwen">
                          {t.providers.qwen}
                        </SelectItem>
                        <SelectItem value="zhipu">
                          {t.providers.zhipu}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <div className="pt-3 border-t border-border/50">
                <Button
                  type="submit"
                  disabled={generateSeo.isPending}
                  className="w-full h-11 text-sm font-semibold tracking-wide uppercase shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] group relative overflow-hidden transition-all"
                >
                  <div className="absolute inset-0 bg-primary/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center gap-2">
                    {generateSeo.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.processing}
                      </>
                    ) : (
                      <>
                        <Terminal className="h-4 w-4" />
                        {t.executeBtn}
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* ─── Results Pane ─── */}
      <div className="flex-1 bg-background overflow-y-auto relative p-6 md:p-8 lg:p-10">
        {generateSeo.isPending ? (
          <LoadingSkeleton />
        ) : !result ? (
          <EmptyState t={t} />
        ) : (
          <Results
            result={result}
            isOutputRtl={isOutputRtl}
            form={form}
            t={t}
            handleCopy={handleCopy}
            copyAllKeywords={copyAllKeywords}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-52 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Skeleton className="h-44 rounded-lg" />
        <Skeleton className="h-44 rounded-lg" />
      </div>
    </div>
  );
}

function EmptyState({ t }: { t: typeof translations["en"] }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4 max-w-xs mx-auto">
      <div className="w-14 h-14 rounded-full border border-dashed border-muted-foreground flex items-center justify-center text-muted-foreground">
        <Terminal className="w-5 h-5" />
      </div>
      <h2 className="text-lg font-medium tracking-tight">{t.standbyTitle}</h2>
      <p className="text-sm text-muted-foreground font-mono leading-relaxed">
        {t.standbyDesc}
      </p>
    </div>
  );
}

function Results({
  result,
  isOutputRtl,
  form,
  t,
  handleCopy,
  copyAllKeywords,
}: {
  result: SeoResult;
  isOutputRtl: boolean;
  form: ReturnType<typeof useForm<FormValues>>;
  t: typeof translations["en"];
  handleCopy: (text: string, field: string) => void;
  copyAllKeywords: (kw: string[]) => void;
}) {
  const lang = form.getValues("language") === "ar" ? t.langOptions.ar : t.langOptions.en;
  const toneKey = form.getValues("tone") as keyof typeof t.toneOptions;
  const tone = t.toneOptions[toneKey];

  return (
    <div
      dir={isOutputRtl ? "rtl" : "ltr"}
      className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-6 duration-600 ease-out pb-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t.generatedTitle}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t.optimizedFor} {lang} · {tone}
          </p>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-primary border-primary/40 bg-primary/10 px-3 py-1 text-xs"
        >
          {t.statusSuccess}
        </Badge>
      </div>

      {/* Slogan */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-transparent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-500" />
        <Card className="relative bg-card/80 backdrop-blur-sm border-primary/20">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              {t.sloganLabel}
            </CardTitle>
            <CopyButton onClick={() => handleCopy(result.slogan, t.sloganLabel)} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-medium leading-tight text-foreground">
              {result.slogan}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Title + Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="flex flex-col border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              {t.pageTitleLabel}
            </CardTitle>
            <CopyButton onClick={() => handleCopy(result.title, t.pageTitleLabel)} />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-4">
            <p className="text-base leading-snug">{result.title}</p>
            <CharCounter value={result.title.length} min={50} max={60} label={t.lengthLabel} />
          </CardContent>
        </Card>

        <Card className="flex flex-col border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              {t.slugLabel}
            </CardTitle>
            <CopyButton onClick={() => handleCopy(result.canonicalSlug, t.slugLabel)} />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="p-3 bg-secondary rounded-md overflow-x-auto border border-border" dir="ltr">
              <code className="text-sm font-mono text-primary/90 whitespace-nowrap">
                /{result.canonicalSlug}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meta Description */}
      <Card className="border-border/50 hover:border-primary/30 transition-colors">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
            {t.metaDescLabel}
          </CardTitle>
          <CopyButton onClick={() => handleCopy(result.metaDescription, t.metaDescLabel)} />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {result.metaDescription}
          </p>
          <CharCounter value={result.metaDescription.length} min={150} max={160} label={t.lengthLabel} />
        </CardContent>
      </Card>

      {/* Keywords */}
      <Card className="border-border/50 hover:border-primary/30 transition-colors">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
            {t.keywordsLabel}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyAllKeywords(result.keywords)}
            className="h-8 text-xs font-mono text-muted-foreground hover:text-primary"
          >
            <Copy className="h-3 w-3 me-1.5" />
            {t.copyAll}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((keyword, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="px-3 py-1 font-normal bg-secondary border border-border/50 text-foreground/80 hover:bg-secondary/80 cursor-pointer transition-colors"
                onClick={() => handleCopy(keyword, keyword)}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Open Graph + Twitter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-border/50">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              {t.ogLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <FieldRow
              label="og:title"
              value={result.ogTitle}
              onCopy={() => handleCopy(result.ogTitle, "og:title")}
            />
            <FieldRow
              label="og:description"
              value={result.ogDescription}
              onCopy={() => handleCopy(result.ogDescription, "og:description")}
              muted
            />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              {t.twitterLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <FieldRow
              label="twitter:title"
              value={result.twitterTitle}
              onCopy={() => handleCopy(result.twitterTitle, "twitter:title")}
            />
            <FieldRow
              label="twitter:description"
              value={result.twitterDescription}
              onCopy={() => handleCopy(result.twitterDescription, "twitter:description")}
              muted
            />
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      {result.faqItems && result.faqItems.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              {t.faqLabel}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const jsonLd = {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: result.faqItems.map((faq) => ({
                    "@type": "Question",
                    name: faq.question,
                    acceptedAnswer: { "@type": "Answer", text: faq.answer },
                  })),
                };
                handleCopy(JSON.stringify(jsonLd, null, 2), "FAQ JSON-LD");
              }}
              className="h-8 text-xs font-mono text-muted-foreground hover:text-primary"
            >
              <Copy className="h-3 w-3 me-1.5" />
              {t.copyJsonLd}
            </Button>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {result.faqItems.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border-border/50"
                >
                  <AccordionTrigger className="text-sm font-medium hover:text-primary text-start">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-1">
                    <div className="flex flex-col gap-3">
                      <p>{faq.answer}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="self-start text-xs h-7 bg-transparent border-border/50"
                        onClick={() =>
                          handleCopy(
                            `Q: ${faq.question}\nA: ${faq.answer}`,
                            `FAQ ${i + 1}`
                          )
                        }
                      >
                        <Copy className="h-3 w-3 me-1.5" />
                        {t.copyQA}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Utility components ─── */

function CopyButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handlePress = () => {
    onClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors ${className}`}
      onClick={handlePress}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function CharCounter({
  value,
  min,
  max,
  label,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
}) {
  const ok = value >= min && value <= max;
  return (
    <div className="flex items-center justify-between border-t border-border/50 pt-3">
      <span className="text-xs font-mono text-muted-foreground">{label}</span>
      <span
        className={`text-xs font-mono px-2 py-0.5 rounded ${
          ok
            ? "bg-emerald-500/10 text-emerald-500"
            : "bg-yellow-500/10 text-yellow-500"
        }`}
      >
        {value} / {max}
      </span>
    </div>
  );
}

function FieldRow({
  label,
  value,
  onCopy,
  muted = false,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  muted?: boolean;
}) {
  return (
    <div className="group relative">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground font-mono">{label}</span>
        <CopyButton
          onClick={onCopy}
          className="opacity-0 group-hover:opacity-100 h-6 w-6"
        />
      </div>
      <p
        className={`text-sm ${muted ? "text-muted-foreground line-clamp-3" : "font-medium"}`}
      >
        {value}
      </p>
    </div>
  );
}
