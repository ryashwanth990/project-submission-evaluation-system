import { Router, type IRouter } from "express";
import { eq, avg } from "drizzle-orm";
import { db, evaluationsTable, projectsTable, usersTable, activityTable } from "@workspace/db";
import {
  CreateEvaluationBody,
  UpdateEvaluationBody,
  GetEvaluationParams,
  UpdateEvaluationParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/evaluations", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const user = req.user!;
  const conditions = user.role === "faculty" ? [eq(evaluationsTable.facultyId, user.id)] : [];

  const evals = await db
    .select({
      id: evaluationsTable.id,
      projectId: evaluationsTable.projectId,
      facultyId: evaluationsTable.facultyId,
      facultyName: usersTable.name,
      score: evaluationsTable.score,
      feedback: evaluationsTable.feedback,
      innovationScore: evaluationsTable.innovationScore,
      technicalScore: evaluationsTable.technicalScore,
      presentationScore: evaluationsTable.presentationScore,
      documentationScore: evaluationsTable.documentationScore,
      createdAt: evaluationsTable.createdAt,
    })
    .from(evaluationsTable)
    .leftJoin(usersTable, eq(evaluationsTable.facultyId, usersTable.id))
    .where(conditions.length > 0 ? conditions[0] : undefined as any);

  res.json(evals);
});

router.post("/evaluations", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.user!.role !== "faculty") {
    res.status(403).json({ error: "Only faculty can submit evaluations" });
    return;
  }

  const parsed = CreateEvaluationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { projectId, score, feedback, innovationScore, technicalScore, presentationScore, documentationScore } = parsed.data;

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [evaluation] = await db
    .insert(evaluationsTable)
    .values({
      projectId,
      facultyId: req.user!.id,
      score,
      feedback,
      innovationScore: innovationScore ?? null,
      technicalScore: technicalScore ?? null,
      presentationScore: presentationScore ?? null,
      documentationScore: documentationScore ?? null,
    })
    .returning();

  const [avgResult] = await db
    .select({ avg: avg(evaluationsTable.score) })
    .from(evaluationsTable)
    .where(eq(evaluationsTable.projectId, projectId));

  const newAvg = avgResult?.avg ? Number(avgResult.avg) : score;

  await db
    .update(projectsTable)
    .set({ status: "evaluated", averageScore: newAvg })
    .where(eq(projectsTable.id, projectId));

  await db.insert(activityTable).values({
    type: "evaluation_submitted",
    message: `Project "${project.title}" evaluated with score ${score}`,
    projectId: project.id,
    userId: req.user!.id,
  });

  const [faculty] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.user!.id));

  res.status(201).json({ ...evaluation, facultyName: faculty?.name ?? null });
});

router.get("/evaluations/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetEvaluationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [evaluation] = await db
    .select({
      id: evaluationsTable.id,
      projectId: evaluationsTable.projectId,
      facultyId: evaluationsTable.facultyId,
      facultyName: usersTable.name,
      score: evaluationsTable.score,
      feedback: evaluationsTable.feedback,
      innovationScore: evaluationsTable.innovationScore,
      technicalScore: evaluationsTable.technicalScore,
      presentationScore: evaluationsTable.presentationScore,
      documentationScore: evaluationsTable.documentationScore,
      createdAt: evaluationsTable.createdAt,
    })
    .from(evaluationsTable)
    .leftJoin(usersTable, eq(evaluationsTable.facultyId, usersTable.id))
    .where(eq(evaluationsTable.id, params.data.id));

  if (!evaluation) {
    res.status(404).json({ error: "Evaluation not found" });
    return;
  }

  res.json(evaluation);
});

router.patch("/evaluations/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.user!.role !== "faculty") {
    res.status(403).json({ error: "Only faculty can update evaluations" });
    return;
  }

  const params = UpdateEvaluationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEvaluationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(evaluationsTable).where(eq(evaluationsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Evaluation not found" });
    return;
  }
  if (existing.facultyId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [evaluation] = await db
    .update(evaluationsTable)
    .set(parsed.data)
    .where(eq(evaluationsTable.id, params.data.id))
    .returning();

  if (parsed.data.score !== undefined) {
    const [avgResult] = await db
      .select({ avg: avg(evaluationsTable.score) })
      .from(evaluationsTable)
      .where(eq(evaluationsTable.projectId, existing.projectId));
    if (avgResult?.avg) {
      await db
        .update(projectsTable)
        .set({ averageScore: Number(avgResult.avg) })
        .where(eq(projectsTable.id, existing.projectId));
    }
  }

  const [faculty] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, evaluation.facultyId));

  res.json({ ...evaluation, facultyName: faculty?.name ?? null });
});

export default router;
