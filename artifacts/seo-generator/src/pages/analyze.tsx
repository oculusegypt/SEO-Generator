import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Search, Loader2, AlertTriangle, CheckCircle, Info,
  Globe, TrendingUp, Zap, Copy, Check, BarChart3,
  ChevronDown, ChevronUp, ArrowRightLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { UiLang, Translations } from "@/lib/i18n";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const schema = z.object({
  url:      z.string().url("رابط غير صالح"),
  provider: z.enum(["openai","gemini","qwen","zhipu"]),
  language: z.enum(["ar","en"]),
  mode:     z.enum(["single","compare"]),
  competitorUrl: z.string().optional(),
});

type FormVals = z.infer<typeof schema>;

interface Props { lang: UiLang; t: Translations }

function ScoreCircle({ score, size = 80 }: { score: number; size?: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={6} className="text-muted/20" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle" className="rotate-90"
        fill={color} fontSize={size * 0.22} fontWeight="700" style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}>
        {score}
      </text>
    </svg>
  );
}

function IssueCard({ issue, isAr }: { issue: { issue: string; impact: string; fix: string; category: string }; isAr: boolean }) {
  const [open, setOpen] = useState(false);
  const colors = { high: "destructive", medium: "secondary", low: "outline" } as const;
  return (
    <Card className="border-border/40">
      <CardContent className="py-2.5 px-4">
        <div className="flex items-start gap-2 cursor-pointer" onClick={() => setOpen(v => !v)}>
          <AlertTriangle size={14} className={issue.impact === "high" ? "text-red-500 mt-0.5 shrink-0" : "text-amber-500 mt-0.5 shrink-0"} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{issue.issue}</p>
          </div>
          <Badge variant={colors[issue.impact as keyof typeof colors] ?? "outline"} className="text-[10px] shrink-0">{issue.impact}</Badge>
          {open ? <ChevronUp size={14} className="shrink-0" /> : <ChevronDown size={14} className="shrink-0" />}
        </div>
        {open && <p className="text-xs text-muted-foreground mt-2 pl-5 leading-relaxed">{issue.fix}</p>}
      </CardContent>
    </Card>
  );
}

export default function AnalyzePage({ lang, t }: Props) {
  const [result, setResult]     = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState<string | null>(null);
  const { toast } = useToast();
  const isAr = lang === "ar";

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { url: "", provider: "zhipu", language: lang, mode: "single", competitorUrl: "" },
  });

  const mode = form.watch("mode");

  async function onSubmit(vals: FormVals) {
    setLoading(true); setResult(null);
    try {
      const endpoint = vals.mode === "compare" ? "analyze/compare" : "analyze/url";
      const body = vals.mode === "compare"
        ? { yourUrl: vals.url, competitorUrl: vals.competitorUrl, provider: vals.provider, language: vals.language }
        : { url: vals.url, provider: vals.provider, language: vals.language };
      const res = await fetch(`${BASE}/api/${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Error");
      setResult(data);
    } catch (e: unknown) {
      toast({ title: isAr ? "خطأ" : "Error", description: e instanceof Error ? e.message : "فشل التحليل", variant: "destructive" });
    } finally { setLoading(false); }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(null), 2000);
    });
  }

  const analysis   = result?.analysis   as Record<string, unknown> | undefined;
  const pageData   = result?.pageData   as Record<string, unknown> | undefined;
  const comparison = result?.comparison as Record<string, unknown> | undefined;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Search size={20} className="text-primary" />
          {isAr ? "محلّل الصفحات" : "URL SEO Analyzer"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? "حلّل أي صفحة واكتشف فرص تحسين SEO بالذكاء الاصطناعي" : "Analyze any page and discover SEO opportunities with AI"}
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="pt-5 pb-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField control={form.control} name="mode" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{isAr ? "وضع التحليل" : "Analysis Mode"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="single">{isAr ? "تحليل صفحة" : "Single Page"}</SelectItem>
                        <SelectItem value="compare">{isAr ? "مقارنة منافس" : "Compare Competitor"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="provider" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{isAr ? "المزوّد" : "Provider"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["openai","gemini","qwen","zhipu"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="language" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{isAr ? "لغة التقرير" : "Report Language"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="ar">عربي</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">{isAr ? "رابط الصفحة" : "Page URL"}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/page" className="h-9 text-sm font-mono" dir="ltr" />
                  </FormControl>
                </FormItem>
              )} />

              {mode === "compare" && (
                <FormField control={form.control} name="competitorUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs flex items-center gap-1">
                      <ArrowRightLeft size={12} /> {isAr ? "رابط المنافس" : "Competitor URL"}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://competitor.com/page" className="h-9 text-sm font-mono" dir="ltr" />
                    </FormControl>
                  </FormItem>
                )} />
              )}

              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading ? <><Loader2 size={14} className="animate-spin" /> {isAr ? "جارٍ التحليل..." : "Analyzing..."}</>
                         : <><Search size={14} /> {mode === "compare" ? (isAr ? "قارن الصفحتين" : "Compare Pages") : (isAr ? "حلّل الصفحة" : "Analyze Page")}</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Single page results */}
      {analysis && pageData && mode === "single" && (
        <div className="space-y-4">
          {/* Score + summary */}
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-1">
                  <ScoreCircle score={(analysis.overallScore as number) ?? 0} />
                  <p className="text-xs text-muted-foreground">{isAr ? "الدرجة الإجمالية" : "Overall Score"}</p>
                  <Badge variant="outline" className="text-xs">{analysis.grade as string}</Badge>
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-muted-foreground">{analysis.summary as string}</p>
                  <div className="grid grid-cols-5 gap-2 mt-4">
                    {Object.entries((analysis.scores as Record<string, number>) ?? {}).map(([k, v]) => (
                      <div key={k} className="text-center">
                        <div className="text-lg font-bold" style={{ color: v >= 80 ? "#22c55e" : v >= 60 ? "#f59e0b" : "#ef4444" }}>{v}</div>
                        <div className="text-[9px] text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="issues">
            <TabsList className="text-xs">
              <TabsTrigger value="issues">{isAr ? "المشاكل" : "Issues"}</TabsTrigger>
              <TabsTrigger value="opportunities">{isAr ? "الفرص" : "Opportunities"}</TabsTrigger>
              <TabsTrigger value="meta">{isAr ? "البيانات" : "Metadata"}</TabsTrigger>
              <TabsTrigger value="quickwins">{isAr ? "مكاسب سريعة" : "Quick Wins"}</TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="space-y-2 mt-3">
              {((analysis.criticalIssues as Array<Record<string, unknown>>) ?? []).map((issue, i) => (
                <IssueCard key={i} issue={issue as { issue: string; impact: string; fix: string; category: string }} isAr={isAr} />
              ))}
            </TabsContent>

            <TabsContent value="opportunities" className="space-y-2 mt-3">
              {((analysis.opportunities as Array<Record<string, unknown>>) ?? []).map((op, i) => (
                <Card key={i} className="border-border/40">
                  <CardContent className="py-2.5 px-4 flex items-start gap-2">
                    <TrendingUp size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{op.opportunity as string}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{op.description as string}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <Badge variant="outline" className="text-[9px]">Impact: {op.potentialImpact as string}</Badge>
                      <Badge variant="secondary" className="text-[9px]">Effort: {op.effort as string}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="meta" className="space-y-3 mt-3">
              {[
                { label: isAr ? "العنوان الحالي" : "Current Title", current: (analysis.titleAnalysis as Record<string,unknown>)?.current, suggestion: (analysis.titleAnalysis as Record<string,unknown>)?.suggestion, key: "title" },
                { label: isAr ? "الوصف الحالي" : "Current Meta Description", current: (analysis.metaAnalysis as Record<string,unknown>)?.current, suggestion: (analysis.metaAnalysis as Record<string,unknown>)?.suggestion, key: "meta" },
              ].map(item => (
                <Card key={item.key} className="border-border/40">
                  <CardContent className="pt-3 pb-3 px-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                    <p className="text-sm bg-muted/40 rounded px-2 py-1.5">{item.current as string}</p>
                    {item.suggestion && (
                      <>
                        <p className="text-xs font-semibold text-primary">{isAr ? "المقترح" : "Suggested"}</p>
                        <div className="flex items-start gap-2">
                          <p className="text-sm bg-primary/5 border border-primary/20 rounded px-2 py-1.5 flex-1">{item.suggestion as string}</p>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyText(item.suggestion as string, item.key)}>
                            {copied === item.key ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="quickwins" className="mt-3">
              <div className="space-y-2">
                {((analysis.quickWins as string[]) ?? []).map((win, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm py-1.5 px-3 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                    <Zap size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                    {win}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Comparison results */}
      {comparison && mode === "compare" && (
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center flex-1">
                  <ScoreCircle score={(comparison.yourScore as number) ?? 0} size={70} />
                  <p className="text-xs mt-1 text-muted-foreground">{isAr ? "صفحتك" : "Your Page"}</p>
                </div>
                <Badge variant={comparison.winner === "yours" ? "default" : comparison.winner === "tie" ? "secondary" : "outline"} className="text-xs">
                  {comparison.winner === "yours" ? (isAr ? "أنت تتقدم" : "You Win") : comparison.winner === "tie" ? (isAr ? "تعادل" : "Tie") : (isAr ? "المنافس أقوى" : "Competitor Wins")}
                </Badge>
                <div className="text-center flex-1">
                  <ScoreCircle score={(comparison.competitorScore as number) ?? 0} size={70} />
                  <p className="text-xs mt-1 text-muted-foreground">{isAr ? "المنافس" : "Competitor"}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">{comparison.summary as string}</p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">{isAr ? "خطة العمل" : "Action Plan"}</h3>
            {((comparison.actionPlan as Array<Record<string, unknown>>) ?? []).map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm py-2 px-3 rounded-md bg-card border border-border/40">
                <span className="text-xs font-bold text-primary shrink-0 w-5">{a.priority as number}.</span>
                <div className="flex-1">{a.action as string}</div>
                <div className="flex gap-1 shrink-0">
                  <Badge variant="outline" className="text-[9px]">{a.effort as string}</Badge>
                  <Badge variant="outline" className="text-[9px]">{a.impact as string}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
