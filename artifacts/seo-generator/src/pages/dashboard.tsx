import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Sparkles, Search, KeyRound, FileText, PenTool,
  Wrench, TrendingUp, BarChart3, Clock, ArrowRight,
  Zap, Globe, CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { UiLang, Translations } from "@/lib/i18n";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Stats {
  totalProjects: number;
  totalAnalyses: number;
  totalArticles: number;
  totalKeywordSessions: number;
  avgSeoScore: number;
  recentProjects: Array<{ id: number; serviceName: string; seoScore?: number; language: string; createdAt: string }>;
}

const TOOLS = [
  { href: "/generate", icon: <Sparkles size={20} />, color: "text-violet-500", bg: "bg-violet-500/10", labelEn: "SEO Generator", labelAr: "مولّد SEO", descEn: "Full SEO package with AI", descAr: "حزمة SEO كاملة بالذكاء الاصطناعي" },
  { href: "/analyze",  icon: <Search size={20} />,   color: "text-blue-500",   bg: "bg-blue-500/10",   labelEn: "URL Analyzer",  labelAr: "محلل الروابط",  descEn: "Audit any page for SEO", descAr: "تدقيق أي صفحة لـ SEO" },
  { href: "/keywords", icon: <KeyRound size={20} />, color: "text-emerald-500",bg: "bg-emerald-500/10",labelEn: "Keyword Research",labelAr: "الكلمات المفتاحية",descEn: "AI keyword clusters", descAr: "مجموعات كلمات مفتاحية بالذكاء الاصطناعي" },
  { href: "/content",  icon: <FileText size={20} />, color: "text-amber-500",  bg: "bg-amber-500/10",  labelEn: "Content Optimizer",labelAr: "محسّن المحتوى",descEn: "Score & optimize content", descAr: "تقييم وتحسين المحتوى" },
  { href: "/article",  icon: <PenTool size={20} />,  color: "text-rose-500",   bg: "bg-rose-500/10",   labelEn: "Article Writer",labelAr: "كاتب المقالات",descEn: "Generate full articles", descAr: "توليد مقالات كاملة" },
  { href: "/tools",    icon: <Wrench size={20} />,   color: "text-cyan-500",   bg: "bg-cyan-500/10",   labelEn: "SEO Tools",     labelAr: "أدوات SEO",   descEn: "Robots, hreflang, schema", descAr: "Robots، Hreflang، Schema" },
];

interface Props { lang: UiLang; t: Translations }

export default function Dashboard({ lang, t }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const isAr = lang === "ar";

  useEffect(() => {
    fetch(`${BASE}/api/projects/stats/summary`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => setStats({ totalProjects: 0, totalAnalyses: 0, totalArticles: 0, totalKeywordSessions: 0, avgSeoScore: 0, recentProjects: [] }))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: isAr ? "المشاريع" : "Projects",    value: stats?.totalProjects ?? 0,       icon: <Sparkles size={16} />,  color: "text-violet-500" },
    { label: isAr ? "التحليلات" : "Analyses",    value: stats?.totalAnalyses ?? 0,       icon: <Search size={16} />,    color: "text-blue-500" },
    { label: isAr ? "المقالات" : "Articles",     value: stats?.totalArticles ?? 0,       icon: <PenTool size={16} />,   color: "text-rose-500" },
    { label: isAr ? "متوسط الدرجة" : "Avg Score", value: stats?.avgSeoScore ? `${stats.avgSeoScore}%` : "–", icon: <BarChart3 size={16} />, color: "text-emerald-500" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "مرحبًا بك 👋" : "Welcome Back 👋"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "منصة SEO الثورية — مدعومة بالذكاء الاصطناعي" : "Revolutionary AI-Powered SEO Platform"}
          </p>
        </div>
        <Badge variant="outline" className="gap-1 text-xs">
          <Zap size={10} className="text-primary" />
          {isAr ? "جاهز" : "Ready"}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="pt-4 pb-3">
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <div className={`flex items-center gap-1.5 text-xs text-muted-foreground mb-1 ${s.color}`}>
                    {s.icon} {s.label}
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tools grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          {isAr ? "الأدوات" : "Tools"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOOLS.map(tool => (
            <Link key={tool.href} href={tool.href}>
              <Card className="border-border/50 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group">
                <CardContent className="pt-4 pb-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg ${tool.bg} flex items-center justify-center shrink-0 ${tool.color}`}>
                    {tool.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {isAr ? tool.labelAr : tool.labelEn}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {isAr ? tool.descAr : tool.descEn}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={13} /> {isAr ? "آخر المشاريع" : "Recent Projects"}
          </h2>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
              {isAr ? "عرض الكل" : "View all"} <ArrowRight size={12} />
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : stats?.recentProjects?.length ? (
          <div className="space-y-2">
            {stats.recentProjects.map(p => (
              <Card key={p.id} className="border-border/40">
                <CardContent className="py-2.5 px-4 flex items-center gap-3">
                  <Globe size={14} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.serviceName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString(isAr ? "ar-SA" : "en-US")}</p>
                  </div>
                  {p.seoScore != null && (
                    <Badge variant={p.seoScore >= 80 ? "default" : p.seoScore >= 60 ? "secondary" : "outline"} className="text-xs">
                      {p.seoScore}%
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border/50">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              <CheckCircle size={24} className="mx-auto mb-2 opacity-30" />
              {isAr ? "لا مشاريع بعد — ابدأ بتوليد حزمة SEO" : "No projects yet — start by generating an SEO package"}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
