import { Router, type IRouter } from "express";
import healthRouter   from "./health.js";
import seoRouter      from "./seo.js";
import settingsRouter from "./settings.js";
import analyzeRouter  from "./analyze.js";
import keywordsRouter from "./keywords.js";
import contentRouter  from "./content.js";
import projectsRouter from "./projects.js";
import toolsRouter    from "./tools.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsRouter);
router.use(seoRouter);
router.use(analyzeRouter);
router.use(keywordsRouter);
router.use(contentRouter);
router.use(projectsRouter);
router.use(toolsRouter);

export default router;
