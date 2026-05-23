import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import projectsRouter from "./projects";
import evaluationsRouter from "./evaluations";
import dashboardRouter from "./dashboard";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(projectsRouter);
router.use(evaluationsRouter);
router.use(dashboardRouter);
router.use(usersRouter);

export default router;
