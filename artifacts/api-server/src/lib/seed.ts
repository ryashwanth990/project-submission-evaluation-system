import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { hashPassword } from "./auth";
import { logger } from "./logger";

const DEMO_USERS = [
  { name: "Admin", email: "admin@sahyadri.edu.in", password: "admin123", role: "admin", department: "CSE AI & ML" },
  { name: "Mr. Shashidhar", email: "shashidhar@sahyadri.edu.in", password: "faculty123", role: "faculty", department: "CSE AI & ML" },
  { name: "Ms. Priya", email: "priya@sahyadri.edu.in", password: "faculty456", role: "faculty", department: "CSE AI & ML" },
  { name: "Hithesh Kundar", email: "hithesh@student.sahyadri.edu.in", password: "student123", role: "student", department: "CSE AI & ML", usn: "4SF24CI061" },
  { name: "Pavan D P", email: "pavan@student.sahyadri.edu.in", password: "student456", role: "student", department: "CSE AI & ML", usn: "4SF24CI116" },
];

export async function seedDemoUsers(): Promise<void> {
  for (const u of DEMO_USERS) {
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, u.email));
    if (existing.length === 0) {
      await db.insert(usersTable).values({
        name: u.name,
        email: u.email,
        passwordHash: hashPassword(u.password),
        role: u.role,
        department: u.department ?? null,
        usn: ("usn" in u ? u.usn : null) ?? null,
      });
      logger.info({ email: u.email, role: u.role }, "Seeded demo user");
    }
  }
}
