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

router.get("/evaluations/export", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const user = req.user!;
  const format = (req.query.format as string) || "csv";

  const conditions = user.role === "faculty" ? [eq(evaluationsTable.facultyId, user.id)] : [];

  const rows = await db
    .select({
      evalId: evaluationsTable.id,
      projectId: evaluationsTable.projectId,
      projectTitle: projectsTable.title,
      projectDomain: projectsTable.domain,
      projectStatus: projectsTable.status,
      semester: projectsTable.semester,
      academicYear: projectsTable.academicYear,
      studentName: usersTable.name,
      facultyName: usersTable.name,
      score: evaluationsTable.score,
      innovationScore: evaluationsTable.innovationScore,
      technicalScore: evaluationsTable.technicalScore,
      presentationScore: evaluationsTable.presentationScore,
      documentationScore: evaluationsTable.documentationScore,
      feedback: evaluationsTable.feedback,
      evaluatedAt: evaluationsTable.createdAt,
    })
    .from(evaluationsTable)
    .leftJoin(projectsTable, eq(evaluationsTable.projectId, projectsTable.id))
    .leftJoin(usersTable, eq(evaluationsTable.facultyId, usersTable.id))
    .where(conditions.length > 0 ? conditions[0] : undefined as any);

  const studentMap: Record<number, string> = {};
  const projectIds = [...new Set(rows.map(r => r.projectId).filter(Boolean))] as number[];
  if (projectIds.length > 0) {
    const students = await db
      .select({ id: projectsTable.id, name: usersTable.name })
      .from(projectsTable)
      .leftJoin(usersTable, eq(projectsTable.studentId, usersTable.id))
      .where(eq(projectsTable.id, projectIds[0]));
    for (const s of students) studentMap[s.id] = s.name ?? "";

    for (const pid of projectIds.slice(1)) {
      const [s] = await db
        .select({ id: projectsTable.id, name: usersTable.name })
        .from(projectsTable)
        .leftJoin(usersTable, eq(projectsTable.studentId, usersTable.id))
        .where(eq(projectsTable.id, pid));
      if (s) studentMap[s.id] = s.name ?? "";
    }
  }

  if (format === "csv") {
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const headers = [
      "Eval ID", "Project ID", "Project Title", "Domain", "Status",
      "Semester", "Academic Year", "Student Name", "Evaluated By",
      "Overall Score", "Innovation", "Technical", "Presentation", "Documentation",
      "Feedback", "Evaluated At",
    ];
    const csvRows = rows.map(r => [
      r.evalId, r.projectId, r.projectTitle, r.projectDomain, r.projectStatus,
      r.semester, r.academicYear, studentMap[r.projectId ?? -1] ?? "",
      r.facultyName, r.score, r.innovationScore, r.technicalScore,
      r.presentationScore, r.documentationScore, r.feedback,
      r.evaluatedAt ? new Date(r.evaluatedAt).toISOString() : "",
    ].map(escape).join(","));

    const csv = [headers.map(h => `"${h}"`).join(","), ...csvRows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="evaluation-report-${Date.now()}.csv"`);
    res.send(csv);
    return;
  }

  res.json(rows);
});

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
