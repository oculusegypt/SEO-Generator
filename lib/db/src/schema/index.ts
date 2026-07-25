import { pgTable, text, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

/* ─── SEO Projects (generated packages) ─── */
export const projectsTable = pgTable("seo_projects", {
  id: serial("id").primaryKey(),
  serviceName:    text("service_name").notNull(),
  provider:       text("provider").notNull().default("zhipu"),
  language:       text("language").notNull().default("ar"),
  businessType:   text("business_type").default("general"),
  targetAudience: text("target_audience").default(""),
  location:       text("location").default(""),
  tone:           text("tone").default("professional"),
  result:         jsonb("result").notNull(),
  seoScore:       integer("seo_score"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

/* ─── URL Analyses ─── */
export const urlAnalysesTable = pgTable("url_analyses", {
  id:       serial("id").primaryKey(),
  url:      text("url").notNull(),
  provider: text("provider").notNull().default("zhipu"),
  pageData: jsonb("page_data").notNull(),
  analysis: jsonb("analysis").notNull(),
  score:    integer("score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ─── Keyword Research Sessions ─── */
export const keywordSessionsTable = pgTable("keyword_sessions", {
  id:          serial("id").primaryKey(),
  seedKeyword: text("seed_keyword").notNull(),
  language:    text("language").notNull().default("ar"),
  provider:    text("provider").notNull().default("zhipu"),
  result:      jsonb("result").notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

/* ─── Content Analyses ─── */
export const contentAnalysesTable = pgTable("content_analyses", {
  id:             serial("id").primaryKey(),
  targetKeyword:  text("target_keyword").notNull(),
  language:       text("language").notNull().default("ar"),
  provider:       text("provider").notNull().default("zhipu"),
  contentSnippet: text("content_snippet").notNull(),
  result:         jsonb("result").notNull(),
  score:          integer("score"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

/* ─── Generated Articles ─── */
export const articlesTable = pgTable("generated_articles", {
  id:          serial("id").primaryKey(),
  title:       text("title").notNull(),
  keyword:     text("keyword").notNull(),
  language:    text("language").notNull().default("ar"),
  provider:    text("provider").notNull().default("zhipu"),
  wordCount:   integer("word_count"),
  content:     text("content").notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});
