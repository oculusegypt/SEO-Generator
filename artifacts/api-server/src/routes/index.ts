import { Router, type IRouter } from "express";
import healthRouter from "./health";
import seoRouter from "./seo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(seoRouter);

export default router;
