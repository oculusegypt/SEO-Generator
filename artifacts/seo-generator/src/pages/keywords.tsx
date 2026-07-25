import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { KeyRound, Loader2, TrendingUp, TrendingDown, Minus, Search, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
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
  seedKeyword:  z.string().min(1),
  language:     z.enum(["ar","en"]),
  provider:     z.enum(["openai","gemini","qwen","zhipu"]),
  businessType: z.string(),
  location:     z.string(),
  count:        z.string(),
});
type FormVals = z.infer<typeof schema>;

interface KwItem { keyword: string; searchVolume: string; difficulty: number; cpc: string; trend: string; intent: string; isLongTail: boolean; priority: string }
interface Cluster { clusterName: string; intent: string; keywords: KwItem[] }

function DifficultyBar({ value }: { value: number }) {
  const color = value <= 30 ? "bg-emerald-500" : value <= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs tabular-nums">{value}</span>
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "rising")   return <TrendingUp size={12} className="text-emerald-500" />;
  if (trend === "declining") return <TrendingDown size={12} className="text-red-500" />;
  return <Minus size={12} className="text-muted-foreground" />;
}

interface Props { lang: UiLang; t: Translations }

export default function KeywordsPage({ lang, t }: Props) {
  const [result, setResult]   = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { toast } = useToast();
  const isAr = lang === "ar";

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { seedKeyword: "", language: lang, provider: "zhipu", businessType: "general", location: "", count: "40" },
  });

  async function onSubmit(vals: FormVals) {
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${BASE}/api/keywords/research`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...vals, count: parseInt(vals.count) }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Error");
      setResult(data);
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally { setLoading(false); }
  }

  function copyKeywords(cluster: Cluster) {
    const text = cluster.keywords.map(k => k.keyword).join("\n");
    navigator.clipboard.writeText(text).then(() => { setCopied(cluster.clusterName); setTimeout(() => setCopied(null), 2000); });
  }

  function copyAllTop() {
    const top = (result?.topKeywordsByPriority as string[]) ?? [];
    navigator.clipboard.writeText(top.join("\n")).then(() => { setCopied("top"); setTimeout(() => setCopied(null), 2000); });
  }

  const clusters = (result?.clusters as Cluster[]) ?? [];
  const questions = (result?.questionKeywords as Array<Record<string, unknown>>) ?? [];
  const longtail  = (result?.longtailOpportunities as Array<Record<string, unknown>>) ?? [];
  const content   = (result?.contentIdeas as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <KeyRound size={20} className="text-primary" />
          {isAr ? "بحث الكلمات المفتاحية" : "Keyword Research"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? "اكتشف كلمات مفتاحية مجمّعة حسب النية وصعوبة التصنيف بالذكاء الاصطناعي" : "Discover clustered keywords with intent and difficulty analysis"}
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="pt-5 pb-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="seedKeyword" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">{isAr ? "الكلمة المفتاحية الأساسية" : "Seed Keyword"}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={isAr ? "مثال: استضافة مواقع، عيادة أسنان" : "e.g. web hosting, dental clinic"} className="h-9 text-sm" />
                  </FormControl>
                </FormItem>
              )} />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: "provider" as const, label: isAr ? "المزوّد" : "Provider", options: [["openai","OpenAI"],["gemini","Gemini"],["qwen","Qwen"],["zhipu","Zhipu"]] },
                  { name: "language" as const, label: isAr ? "اللغة" : "Language", options: [["ar","العربية"],["en","English"]] },
                  { name: "businessType" as const, label: isAr ? "نوع النشاط" : "Business Type", options: [["general","General"],["local","Local"],["ecommerce","E-Commerce"],["saas","SaaS"],["blog","Blog"]] },
                  { name: "count" as const, label: isAr ? "عدد الكلمات" : "Keywords Count", options: [["20","20"],["40","40"],["60","60"],["80","80"]] },
                ].map(f => (
                  <FormField key={f.name} control={form.control} name={f.name} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{f.label}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{f.options.map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                ))}
              </div>

              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">{isAr ? "الموقع (اختياري)" : "Location (optional)"}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={isAr ? "الرياض، دبي، القاهرة" : "Riyadh, Dubai, Cairo"} className="h-9 text-sm" />
                  </FormControl>
                </FormItem>
              )} />

              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading ? <><Loader2 size={14} className="animate-spin" />{isAr ? "جارٍ البحث..." : "Researching..."}</>
                         : <><Search size={14} />{isAr ? "ابحث عن الكلمات المفتاحية" : "Research Keywords"}</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Summary */}
          {result.marketSummary && (
            <Card className="border-border/50 bg-primary/3">
              <CardContent className="py-3 px-4 text-sm text-muted-foreground">{result.marketSummary as string}</CardContent>
            </Card>
          )}

          {/* Top keywords */}
          {(result.topKeywordsByPriority as string[] | undefined)?.length && (
            <Card className="border-border/50">
              <CardHeader className="py-3 px-4 flex-row items-center justify-between">
                <CardTitle className="text-sm">{isAr ? "أهم الكلمات المفتاحية" : "Top Priority Keywords"}</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copyAllTop}>
                  {copied === "top" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />} {isAr ? "نسخ الكل" : "Copy All"}
                </Button>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex flex-wrap gap-1.5">
                  {(result.topKeywordsByPriority as string[]).map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="clusters">
            <TabsList className="text-xs">
              <TabsTrigger value="clusters">{isAr ? "المجموعات" : "Clusters"} ({clusters.length})</TabsTrigger>
              <TabsTrigger value="questions">{isAr ? "الأسئلة" : "Questions"} ({questions.length})</TabsTrigger>
              <TabsTrigger value="longtail">{isAr ? "الذيل الطويل" : "Long Tail"} ({longtail.length})</TabsTrigger>
              <TabsTrigger value="content">{isAr ? "أفكار المحتوى" : "Content Ideas"} ({content.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="clusters" className="space-y-3 mt-3">
              {clusters.map((cluster, ci) => (
                <Card key={ci} className="border-border/40">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    onClick={() => setExpanded(expanded === cluster.clusterName ? null : cluster.clusterName)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{cluster.clusterName}</span>
                      <Badge variant="outline" className="text-[10px]">{cluster.intent}</Badge>
                      <span className="text-xs text-muted-foreground">{cluster.keywords.length} kw</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={e => { e.stopPropagation(); copyKeywords(cluster); }}>
                        {copied === cluster.clusterName ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                      </Button>
                      {expanded === cluster.clusterName ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>
                  {expanded === cluster.clusterName && (
                    <div className="px-4 pb-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground border-b border-border/40">
                              <th className="text-left py-1.5 font-medium">{isAr ? "الكلمة" : "Keyword"}</th>
                              <th className="text-left py-1.5 font-medium">{isAr ? "الحجم" : "Volume"}</th>
                              <th className="text-left py-1.5 font-medium">{isAr ? "الصعوبة" : "Difficulty"}</th>
                              <th className="text-left py-1.5 font-medium">CPC</th>
                              <th className="text-left py-1.5 font-medium">{isAr ? "الاتجاه" : "Trend"}</th>
                              <th className="text-left py-1.5 font-medium">{isAr ? "الأولوية" : "Priority"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cluster.keywords.map((kw, ki) => (
                              <tr key={ki} className="border-b border-border/20 hover:bg-muted/30">
                                <td className="py-1.5 font-medium">{kw.keyword} {kw.isLongTail && <Badge variant="outline" className="text-[8px] ml-1">LT</Badge>}</td>
                                <td className="py-1.5 text-muted-foreground">{kw.searchVolume}</td>
                                <td className="py-1.5"><DifficultyBar value={kw.difficulty} /></td>
                                <td className="py-1.5 text-muted-foreground">${kw.cpc}</td>
                                <td className="py-1.5"><TrendIcon trend={kw.trend} /></td>
                                <td className="py-1.5">
                                  <Badge variant={kw.priority === "high" ? "default" : kw.priority === "medium" ? "secondary" : "outline"} className="text-[9px]">{kw.priority}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="questions" className="space-y-2 mt-3">
              {questions.map((q, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-md bg-card border border-border/40 text-sm">
                  <span className="text-muted-foreground shrink-0">?</span>
                  <span className="flex-1">{q.question as string}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{q.searchVolume as string}</span>
                  <DifficultyBar value={q.difficulty as number} />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="longtail" className="space-y-2 mt-3">
              {longtail.map((lt, i) => (
                <Card key={i} className="border-border/40">
                  <CardContent className="py-2.5 px-4 flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{lt.keyword as string}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{lt.reason as string}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{lt.searchVolume as string}</p>
                      <DifficultyBar value={lt.difficulty as number} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="content" className="space-y-2 mt-3">
              {content.map((idea, i) => (
                <Card key={i} className="border-border/40">
                  <CardContent className="py-3 px-4 flex items-start gap-3">
                    <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{idea.type as string}</Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{idea.title as string}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(idea.targetKeywords as string[] ?? []).map((kw,ki) => <Badge key={ki} variant="secondary" className="text-[9px]">{kw}</Badge>)}
                      </div>
                    </div>
                    <Badge variant={idea.estimatedTraffic === "high" ? "default" : "secondary"} className="text-[10px] shrink-0">{idea.estimatedTraffic as string}</Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
