import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Copy, Terminal, Loader2, Check } from "lucide-react";
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
  CardDescription,
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

const formSchema = z.object({
  serviceName: z.string().min(2, "Service name is required").max(200),
  language: z.enum(["ar", "en"]),
  tone: z.enum(["professional", "friendly", "persuasive"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const { toast } = useToast();
  const generateSeo = useGenerateSeo();
  const [result, setResult] = useState<SeoResult | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceName: "",
      language: "en",
      tone: "professional",
    },
  });

  const language = form.watch("language");
  const isRtl = language === "ar";

  function onSubmit(values: FormValues) {
    generateSeo.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setResult(data);
          toast({
            title: "Generation Complete",
            description: "SEO content has been successfully generated.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to generate SEO content. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${field} has been copied.`,
    });
  };

  const copyAllKeywords = (keywords: string[]) => {
    navigator.clipboard.writeText(keywords.join(", "));
    toast({
      title: "Keywords Copied",
      description: "All keywords copied as comma-separated list.",
    });
  };

  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-background text-foreground overflow-hidden">
      
      {/* Sidebar Command Center */}
      <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-border bg-sidebar flex flex-col h-full z-10 shadow-2xl">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3 text-primary mb-2">
            <div className="p-2 bg-primary/10 rounded-md ring-1 ring-primary/20">
              <Terminal className="h-5 w-5" />
            </div>
            <h1 className="font-semibold text-lg tracking-tight text-sidebar-foreground">
              SEO Command Center
            </h1>
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            v1.0.0 // STATUS: READY
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="serviceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                      Target Entity
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Enterprise Cloud Hosting"
                        {...field}
                        className="font-medium bg-background border-border/50 focus-visible:ring-primary h-11"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      The specific product or service to optimize.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                        Output Lang
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-background border-border/50">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English (EN)</SelectItem>
                          <SelectItem value="ar">Arabic (AR)</SelectItem>
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
                        Voice Tone
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-background border-border/50">
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="persuasive">Persuasive</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 border-t border-border/50">
                <Button
                  type="submit"
                  disabled={generateSeo.isPending}
                  className="w-full h-12 text-sm font-semibold tracking-wide uppercase transition-all shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center gap-2">
                    {generateSeo.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Terminal className="h-4 w-4" />
                        Execute Generation
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Main Results Area */}
      <div className="flex-1 bg-background overflow-y-auto relative p-6 md:p-8 lg:p-12">
        {generateSeo.isPending ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <Skeleton className="h-8 w-[250px] bg-card-border" />
              <Skeleton className="h-4 w-[150px] bg-card-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-[200px] rounded-lg bg-card-border" />
              <Skeleton className="h-[200px] rounded-lg bg-card-border" />
            </div>
            <Skeleton className="h-[120px] rounded-lg bg-card-border" />
            <Skeleton className="h-[300px] rounded-lg bg-card-border" />
          </div>
        ) : !result ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full border border-dashed border-muted-foreground flex items-center justify-center mb-4 text-muted-foreground">
              <Terminal className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-medium tracking-tight">System Standby</h2>
            <p className="text-sm text-muted-foreground font-mono">
              Input target parameters in the command center and execute generation to initialize data.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700 ease-out pb-20">
            
            <div className="flex items-center justify-between border-b border-border pb-6">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">Generated Assets</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Optimized for {form.getValues().language === 'ar' ? 'Arabic' : 'English'} | {form.getValues().tone} tone
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-primary border-primary/50 bg-primary/10 px-3 py-1">
                STATUS: SUCCESS
              </Badge>
            </div>

            {/* Slogan */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-transparent rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <Card className="relative bg-card/80 backdrop-blur-sm border-primary/20">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Marketing Slogan</CardTitle>
                  <CopyButton onClick={() => handleCopy(result.slogan, "Slogan")} />
                </CardHeader>
                <CardContent>
                  <p dir={isRtl ? "rtl" : "ltr"} className="text-2xl md:text-3xl font-medium leading-tight text-foreground">
                    {result.slogan}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Core Meta Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Page Title */}
              <Card className="flex flex-col group border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Page Title</CardTitle>
                  <CopyButton onClick={() => handleCopy(result.title, "Title")} />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <p dir={isRtl ? "rtl" : "ltr"} className="text-lg leading-snug">
                    {result.title}
                  </p>
                  <div className="flex items-center justify-between border-t border-border/50 pt-4">
                    <span className="text-xs font-mono text-muted-foreground">Length</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                      result.title.length >= 50 && result.title.length <= 60 
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {result.title.length} / 60
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Canonical Slug */}
              <Card className="flex flex-col group border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Canonical Slug</CardTitle>
                  <CopyButton onClick={() => handleCopy(result.canonicalSlug, "Slug")} />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center">
                  <div className="p-3 bg-secondary rounded-md overflow-x-auto border border-border">
                    <code className="text-sm font-mono text-primary/90 whitespace-nowrap">
                      /{result.canonicalSlug}
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Meta Description */}
            <Card className="group border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Meta Description</CardTitle>
                <CopyButton onClick={() => handleCopy(result.metaDescription, "Meta Description")} />
              </CardHeader>
              <CardContent>
                <p dir={isRtl ? "rtl" : "ltr"} className="text-base leading-relaxed text-muted-foreground">
                  {result.metaDescription}
                </p>
                <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-4">
                  <span className="text-xs font-mono text-muted-foreground">Length</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                    result.metaDescription.length >= 150 && result.metaDescription.length <= 160 
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {result.metaDescription.length} / 160
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card className="border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Keywords Target</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyAllKeywords(result.keywords)}
                  className="h-8 text-xs font-mono text-muted-foreground hover:text-primary"
                >
                  <Copy className="h-3 w-3 mr-2" />
                  COPY ALL
                </Button>
              </CardHeader>
              <CardContent>
                <div dir={isRtl ? "rtl" : "ltr"} className="flex flex-wrap gap-2">
                  {result.keywords.map((keyword, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 font-normal bg-secondary border border-border/50 text-foreground/80 hover:bg-secondary/80">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Social Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Open Graph */}
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Open Graph
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="group relative">
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-xs text-muted-foreground font-mono">og:title</Label>
                      <CopyButton onClick={() => handleCopy(result.ogTitle, "OG Title")} className="opacity-0 group-hover:opacity-100 h-6 w-6" />
                    </div>
                    <p dir={isRtl ? "rtl" : "ltr"} className="text-sm font-medium">{result.ogTitle}</p>
                  </div>
                  <div className="group relative pt-2 border-t border-border/50">
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-xs text-muted-foreground font-mono">og:description</Label>
                      <CopyButton onClick={() => handleCopy(result.ogDescription, "OG Description")} className="opacity-0 group-hover:opacity-100 h-6 w-6" />
                    </div>
                    <p dir={isRtl ? "rtl" : "ltr"} className="text-sm text-muted-foreground line-clamp-3">{result.ogDescription}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Twitter */}
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                    Twitter Card
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="group relative">
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-xs text-muted-foreground font-mono">twitter:title</Label>
                      <CopyButton onClick={() => handleCopy(result.twitterTitle, "Twitter Title")} className="opacity-0 group-hover:opacity-100 h-6 w-6" />
                    </div>
                    <p dir={isRtl ? "rtl" : "ltr"} className="text-sm font-medium">{result.twitterTitle}</p>
                  </div>
                  <div className="group relative pt-2 border-t border-border/50">
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-xs text-muted-foreground font-mono">twitter:description</Label>
                      <CopyButton onClick={() => handleCopy(result.twitterDescription, "Twitter Description")} className="opacity-0 group-hover:opacity-100 h-6 w-6" />
                    </div>
                    <p dir={isRtl ? "rtl" : "ltr"} className="text-sm text-muted-foreground line-clamp-3">{result.twitterDescription}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FAQs */}
            {result.faqItems && result.faqItems.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-mono">FAQ Schema</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      const jsonLd = {
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": result.faqItems.map(faq => ({
                          "@type": "Question",
                          "name": faq.question,
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": faq.answer
                          }
                        }))
                      };
                      handleCopy(JSON.stringify(jsonLd, null, 2), "FAQ JSON-LD");
                    }}
                    className="h-8 text-xs font-mono text-muted-foreground hover:text-primary"
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    COPY JSON-LD
                  </Button>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {result.faqItems.map((faq, i) => (
                      <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
                        <AccordionTrigger dir={isRtl ? "rtl" : "ltr"} className="text-sm font-medium hover:text-primary">
                          <span className="text-left flex-1">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent dir={isRtl ? "rtl" : "ltr"} className="text-muted-foreground leading-relaxed pt-2">
                          <div className="flex flex-col gap-3">
                            <p>{faq.answer}</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="self-start text-xs h-7 bg-transparent border-border/50" 
                              onClick={() => handleCopy(`Q: ${faq.question}\nA: ${faq.answer}`, `FAQ ${i+1}`)}
                            >
                              <Copy className="h-3 w-3 mr-2" />
                              Copy Q&A
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
        )}
      </div>
    </div>
  );
}

// Minimal Copy Button Component
function CopyButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
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

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={className}>{children}</label>;
}
