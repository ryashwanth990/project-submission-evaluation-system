import { Router, type IRouter } from "express";
import { eq, count, avg, desc } from "drizzle-orm";
import { db, projectsTable, evaluationsTable, activityTable, usersTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const user = req.user!;

  let projectRows;
  if (user.role === "student") {
    projectRows = await db.select().from(projectsTable).where(eq(projectsTable.studentId, user.id));
  } else {
    projectRows = await db.select().from(projectsTable);
  }

  const total = projectRows.length;
  const pending = projectRows.filter((p) => p.status === "submitted" || p.status === "under_review").length;
  const evaluated = projectRows.filter((p) => p.status === "evaluated" || p.status === "approved").length;
  const scores = projectRows.filter((p) => p.averageScore != null).map((p) => p.averageScore!);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  const domainMap = new Map<string, number>();
  for (const p of projectRows) {
    domainMap.set(p.domain, (domainMap.get(p.domain) ?? 0) + 1);
  }
  const byDomain = Array.from(domainMap.entries()).map(([domain, count]) => ({ domain, count }));

  const statusMap = new Map<string, number>();
  for (const p of projectRows) {
    statusMap.set(p.status, (statusMap.get(p.status) ?? 0) + 1);
  }
  const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  res.json({
    totalProjects: total,
    pendingReview: pending,
    evaluated,
    averageScore: avgScore,
    byDomain,
    byStatus,
  });
});

router.get("/dashboard/recent-activity", requireAuth, async (_req, res): Promise<void> => {
  const activities = await db
    .select({
      id: activityTable.id,
      type: activityTable.type,
      message: activityTable.message,
      projectId: activityTable.projectId,
      createdAt: activityTable.createdAt,
    })
    .from(activityTable)
    .orderBy(desc(activityTable.createdAt))
    .limit(10);

  const withTitles = await Promise.all(
    activities.map(async (a) => {
      let projectTitle: string | null = null;
      if (a.projectId) {
        const [p] = await db
          .select({ title: projectsTable.title })
          .from(projectsTable)
          .where(eq(projectsTable.id, a.projectId));
        projectTitle = p?.title ?? null;
      }
      return { ...a, projectTitle };
    })
  );

  res.json(withTitles);
});

export default router;
