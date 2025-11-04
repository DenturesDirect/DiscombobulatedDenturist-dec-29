import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth"),
  phone: text("phone"),
  email: text("email"),
  isCDCP: boolean("is_cdcp").default(false).notNull(),
  copayDiscussed: boolean("copay_discussed").default(false).notNull(),
  currentToothShade: text("current_tooth_shade"),
  requestedToothShade: text("requested_tooth_shade"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentType: text("appointment_type"),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export const clinicalNotes = pgTable("clinical_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClinicalNoteSchema = createInsertSchema(clinicalNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertClinicalNote = z.infer<typeof insertClinicalNoteSchema>;
export type ClinicalNote = typeof clinicalNotes.$inferSelect;

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  assignee: text("assignee").notNull(),
  patientId: varchar("patient_id").references(() => patients.id),
  dueDate: timestamp("due_date"),
  priority: text("priority").notNull().default("normal"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const patientFiles = pgTable("patient_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  storageKey: text("storage_key").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertPatientFileSchema = createInsertSchema(patientFiles).omit({
  id: true,
  uploadedAt: true,
});

export type InsertPatientFile = z.infer<typeof insertPatientFileSchema>;
export type PatientFile = typeof patientFiles.$inferSelect;
