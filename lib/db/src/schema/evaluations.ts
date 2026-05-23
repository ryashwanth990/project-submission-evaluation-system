import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const evaluationsTable = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  facultyId: integer("faculty_id").notNull(),
  score: real("score").notNull(),
  feedback: text("feedback").notNull(),
  innovationScore: real("innovation_score"),
  technicalScore: real("technical_score"),
  presentationScore: real("presentation_score"),
  documentationScore: real("documentation_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEvaluationSchema = createInsertSchema(evaluationsTable).omit({ id: true, createdAt: true });
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluationsTable.$inferSelect;
