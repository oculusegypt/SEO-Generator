import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Sparkles, Search, KeyRound, FileText,
  PenTool, Wrench, History, Settings, ChevronLeft, ChevronRight,
  Sun, Moon, Languages, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  href:    string;
  label:   string;
  labelAr: string;
  icon:    ReactNode;
  badge?:  string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",          label: "Dashboard",         labelAr: "الرئيسية",           icon: <LayoutDashboard size={16} /> },
  { href: "/generate",  label: "SEO Generator",     labelAr: "مولّد SEO",           icon: <Sparkles size={16} />,  badge: "AI" },
  { href: "/analyze",   label: "URL Analyzer",      labelAr: "محلل الروابط",        icon: <Search size={16} />,    badge: "NEW" },
  { href: "/keywords",  label: "Keyword Research",  labelAr: "الكلمات المفتاحية",   icon: <KeyRound size={16} />,  badge: "NEW" },
  { href: "/content",   label: "Content Optimizer", labelAr: "محسّن المحتوى",       icon: <FileText size={16} />,  badge: "NEW" },
  { href: "/article",   label: "Article Writer",    labelAr: "كاتب المقالات",       icon: <PenTool size={16} />,   badge: "NEW" },
  { href: "/tools",     label: "SEO Tools",         labelAr: "أدوات SEO",           icon: <Wrench size={16} /> },
  { href: "/history",   label: "History",           labelAr: "السجل",               icon: <History size={16} /> },
];

interface LayoutProps {
  children: ReactNode;
  lang: "ar" | "en";
  onToggleLang: () => void;
}

export function Layout({ children, lang, onToggleLang }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [location]  = useLocation();
  const { theme, toggleTheme } = useLocalTheme();
  const isAr = lang === "ar";

  return (
    <div className={cn("flex min-h-screen bg-background text-foreground", isAr && "font-arabic")} dir={isAr ? "rtl" : "ltr"}>
      {/* ── Sidebar ── */}
      <aside className={cn(
        "flex flex-col border-r border-border/60 bg-card/50 backdrop-blur-sm transition-all duration-300 shrink-0",
        collapsed ? "w-14" : "w-56"
      )}>
        {/* Brand */}
        <div className={cn("flex items-center gap-2 p-3 border-b border-border/40 h-14", collapsed && "justify-center")}>
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Zap size={14} className="text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate">SEO Pro 2026</p>
              <p className="text-[9px] text-muted-foreground leading-tight">Revolutionary Platform</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-2.5 mx-1.5 px-2.5 py-2 rounded-md cursor-pointer transition-all text-xs group",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-0"
                )}>
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <span className="truncate flex-1">{isAr ? item.labelAr : item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <Badge variant={active ? "outline" : "secondary"} className="text-[8px] px-1 py-0 h-3.5">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="border-t border-border/40 p-2 space-y-1">
          <Link href="/settings">
            <div className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-all text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              collapsed && "justify-center px-0"
            )}>
              <Settings size={16} className="shrink-0" />
              {!collapsed && <span>{isAr ? "الإعدادات" : "Settings"}</span>}
            </div>
          </Link>
          <div className={cn("flex gap-1", collapsed ? "flex-col items-center" : "px-1")}>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onToggleLang}>
              <Languages size={13} />
            </Button>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-border hover:bg-primary/20 rounded-r-md flex items-center justify-center text-muted-foreground transition-colors z-10"
          style={{ [isAr ? "left" : "right"]: "-1rem" }}
        >
          {isAr
            ? (collapsed ? <ChevronLeft size={10} /> : <ChevronRight size={10} />)
            : (collapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />)
          }
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
