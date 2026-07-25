/**
 * Projects CRUD — saves/lists/deletes SEO generation history using PostgreSQL.
 */
import { Router, type IRouter } from "express";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { projectsTable, urlAnalysesTable, keywordSessionsTable, articlesTable } from "@workspace/db/schema";

const router: IRouter = Router();

/* ─── GET /api/projects ─── */
router.get("/projects", async (_req, res) => {
  try {
    const projects = await db
      .select({
        id: projectsTable.id,
        serviceName: projectsTable.serviceName,
        provider: projectsTable.provider,
        language: projectsTable.language,
        businessType: projectsTable.businessType,
        location: projectsTable.location,
        seoScore: projectsTable.seoScore,
        createdAt: projectsTable.createdAt,
      })
      .from(projectsTable)
      .orderBy(desc(projectsTable.createdAt))
      .limit(50);
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: "فشل تحميل المشاريع" });
  }
});

/* ─── GET /api/projects/:id ─── */
router.get("/projects/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  try {
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
    if (!project) { res.status(404).json({ error: "المشروع غير موجود" }); return; }
    res.json(project);
  } catch {
    res.status(500).json({ error: "فشل تحميل المشروع" });
  }
});

/* ─── POST /api/projects ─── */
const SaveProjectBody = z.object({
  serviceName:    z.string().min(1),
  provider:       z.string().default("zhipu"),
  language:       z.string().default("ar"),
  businessType:   z.string().optional(),
  targetAudience: z.string().optional(),
  location:       z.string().optional(),
  tone:           z.string().optional(),
  result:         z.record(z.unknown()),
  seoScore:       z.number().int().optional(),
});

router.post("/projects", async (req, res) => {
  const parsed = SaveProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات غير صالحة" }); return; }
  try {
    const [saved] = await db.insert(projectsTable).values(parsed.data).returning({ id: projectsTable.id });
    res.status(201).json({ id: saved.id, message: "تم حفظ المشروع" });
  } catch (err) {
    res.status(500).json({ error: "فشل حفظ المشروع" });
  }
});

/* ─── DELETE /api/projects/:id ─── */
router.delete("/projects/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  try {
    await db.delete(projectsTable).where(eq(projectsTable.id, id));
    res.json({ message: "تم حذف المشروع" });
  } catch {
    res.status(500).json({ error: "فشل حذف المشروع" });
  }
});

/* ─── GET /api/projects/stats ─── */
router.get("/projects/stats/summary", async (_req, res) => {
  try {
    const [projects, analyses, articles, keywords] = await Promise.all([
      db.select({ id: projectsTable.id, seoScore: projectsTable.seoScore, createdAt: projectsTable.createdAt }).from(projectsTable).orderBy(desc(projectsTable.createdAt)).limit(100),
      db.select({ id: urlAnalysesTable.id }).from(urlAnalysesTable),
      db.select({ id: articlesTable.id }).from(articlesTable),
      db.select({ id: keywordSessionsTable.id }).from(keywordSessionsTable),
    ]);
    const avgScore = projects.filter(p => p.seoScore).length
      ? Math.round(projects.filter(p => p.seoScore).reduce((s, p) => s + (p.seoScore ?? 0), 0) / projects.filter(p => p.seoScore).length)
      : 0;
    res.json({
      totalProjects:   projects.length,
      totalAnalyses:   analyses.length,
      totalArticles:   articles.length,
      totalKeywordSessions: keywords.length,
      avgSeoScore:     avgScore,
      recentProjects:  projects.slice(0, 5),
    });
  } catch {
    res.status(500).json({ error: "فشل تحميل الإحصائيات" });
  }
});

export default router;
