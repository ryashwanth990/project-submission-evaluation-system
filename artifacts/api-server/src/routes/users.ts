import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/faculty", requireAuth, async (_req, res): Promise<void> => {
  const faculty = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      usn: usersTable.usn,
      department: usersTable.department,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "faculty"));

  res.json(faculty);
});

router.get("/students", requireAuth, async (_req, res): Promise<void> => {
  const students = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      usn: usersTable.usn,
      department: usersTable.department,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "student"));

  res.json(students);
});

export default router;
