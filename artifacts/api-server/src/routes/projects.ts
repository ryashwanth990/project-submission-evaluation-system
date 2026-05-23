import { Router, type IRouter } from "express";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { db, projectsTable, usersTable, activityTable } from "@workspace/db";
import {
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
  AssignEvaluatorParams,
  AssignEvaluatorBody,
  ListProjectsQueryParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { evaluationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/projects", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = ListProjectsQueryParams.safeParse(req.query);
  const { status, search } = params.success ? params.data : { status: undefined, search: undefined };
  const user = req.user!;

  let conditions: ReturnType<typeof eq>[] = [];
  if (user.role === "student") {
    conditions.push(eq(projectsTable.studentId, user.id));
  }
  if (status) {
    conditions.push(eq(projectsTable.status, status));
  }

  const baseQuery = db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      description: projectsTable.description,
      domain: projectsTable.domain,
      status: projectsTable.status,
      studentId: projectsTable.studentId,
      studentName: usersTable.name,
      evaluatorId: projectsTable.evaluatorId,
      githubUrl: projectsTable.githubUrl,
      reportUrl: projectsTable.reportUrl,
      teamMembers: projectsTable.teamMembers,
      semester: projectsTable.semester,
      academicYear: projectsTable.academicYear,
      averageScore: projectsTable.averageScore,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
    })
    .from(projectsTable)
    .leftJoin(usersTable, eq(projectsTable.studentId, usersTable.id));

  let projects;
  if (search) {
    const searchConditions = or(
      ilike(projectsTable.title, `%${search}%`),
      ilike(projectsTable.domain, `%${search}%`)
    );
    projects = conditions.length > 0
      ? await baseQuery.where(and(...conditions, searchConditions))
      : await baseQuery.where(searchConditions!);
  } else {
    projects = conditions.length > 0
      ? await baseQuery.where(and(...conditions))
      : await baseQuery;
  }

  const evalMap = new Map<number, { evaluatorName: string | null }>();
  for (const p of projects) {
    if (p.evaluatorId) {
      const [ev] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, p.evaluatorId));
      evalMap.set(p.id, { evaluatorName: ev?.name ?? null });
    }
  }

  res.json(
    projects.map((p) => ({
      ...p,
      evaluatorName: evalMap.get(p.id)?.evaluatorName ?? null,
    }))
  );
});

router.post("/projects", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.user!.role !== "student") {
    res.status(403).json({ error: "Only students can submit projects" });
    return;
  }

  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, domain, githubUrl, reportUrl, teamMembers, semester, academicYear } = parsed.data;

  const [project] = await db
    .insert(projectsTable)
    .values({
      title,
      description,
      domain,
      studentId: req.user!.id,
      githubUrl: githubUrl ?? null,
      reportUrl: reportUrl ?? null,
      teamMembers: teamMembers ?? null,
      semester: semester ?? null,
      academicYear: academicYear ?? null,
      status: "submitted",
    })
    .returning();

  await db.insert(activityTable).values({
    type: "project_submitted",
    message: `New project "${title}" submitted`,
    projectId: project.id,
    userId: req.user!.id,
  });

  const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, project.studentId));

  res.status(201).json({
    ...project,
    studentName: student?.name ?? null,
    evaluatorName: null,
  });
});

router.get("/projects/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, project.studentId));
  let evaluatorName: string | null = null;
  if (project.evaluatorId) {
    const [ev] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, project.evaluatorId));
    evaluatorName = ev?.name ?? null;
  }

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
    .where(eq(evaluationsTable.projectId, project.id));

  res.json({
    ...project,
    studentName: student?.name ?? null,
    evaluatorName,
    evaluations: evals,
  });
});

router.patch("/projects/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (req.user!.role === "student" && existing.studentId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set(parsed.data)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, project.studentId));
  let evaluatorName: string | null = null;
  if (project.evaluatorId) {
    const [ev] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, project.evaluatorId));
    evaluatorName = ev?.name ?? null;
  }

  res.json({ ...project, studentName: student?.name ?? null, evaluatorName });
});

router.delete("/projects/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (req.user!.role === "student" && existing.studentId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(evaluationsTable).where(eq(evaluationsTable.projectId, params.data.id));
  await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/projects/:id/assign", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.user!.role !== "faculty") {
    res.status(403).json({ error: "Only faculty can assign evaluators" });
    return;
  }

  const params = AssignEvaluatorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AssignEvaluatorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [updated] = await db
    .update(projectsTable)
    .set({ evaluatorId: parsed.data.facultyId, status: "under_review" })
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  await db.insert(activityTable).values({
    type: "evaluator_assigned",
    message: `Evaluator assigned to project "${project.title}"`,
    projectId: project.id,
    userId: req.user!.id,
  });

  const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.studentId));
  const [ev] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, parsed.data.facultyId));

  res.json({ ...updated, studentName: student?.name ?? null, evaluatorName: ev?.name ?? null });
});

export default router;
