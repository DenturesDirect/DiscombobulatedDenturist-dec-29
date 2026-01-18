import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").default("staff"),
  officeId: varchar("office_id").references(() => offices.id),
  canViewAllOffices: boolean("can_view_all_offices").default(false).notNull(),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const loginAttempts = pgTable("login_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  success: boolean("success").notNull(),
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Offices - for multi-tenant support
export const offices = pgTable("offices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Dentures Direct", "Toronto Smile Centre"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Office = typeof offices.$inferSelect;
export type InsertOffice = typeof offices.$inferInsert;

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officeId: varchar("office_id").references(() => offices.id).notNull(),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth"),
  phone: text("phone"),
  email: text("email"),
  isCDCP: boolean("is_cdcp").default(false).notNull(),
  workInsurance: boolean("work_insurance").default(false).notNull(),
  copayDiscussed: boolean("copay_discussed").default(false).notNull(),
  currentToothShade: text("current_tooth_shade"),
  requestedToothShade: text("requested_tooth_shade"),
  photoUrl: text("photo_url"),
  upperDentureType: text("upper_denture_type"),
  lowerDentureType: text("lower_denture_type"),
  assignedTo: text("assigned_to"),
  nextStep: text("next_step"),
  dueDate: timestamp("due_date"),
  lastStepCompleted: text("last_step_completed"),
  lastStepDate: timestamp("last_step_date"),
  emailNotifications: boolean("email_notifications").default(false).notNull(),
  textNotifications: boolean("text_notifications").default(false).notNull(),
  examPaid: text("exam_paid"), // "yes", "no", "not applicable"
  repairPaid: text("repair_paid"), // "yes", "no", "not applicable"
  newDenturePaid: text("new_denture_paid"), // "yes", "no", "not applicable"
  predeterminationStatus: text("predetermination_status"), // "not applicable", "pending", "approved", "not approved"
  treatmentInitiationDate: timestamp("treatment_initiation_date"), // Date treatment actually started (excludes old chart uploads)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
}).extend({
  officeId: z.string().optional(), // Optional in request, will be auto-assigned from user's office if not provided
  lastStepDate: z.union([z.date(), z.string()]).transform((val) => {
    if (val instanceof Date) return val;
    if (typeof val === 'string' && val.trim().length > 0) return new Date(val);
    return null;
  }).nullable().optional(),
  treatmentInitiationDate: z.union([z.date(), z.string()]).transform((val) => {
    if (val instanceof Date) return val;
    if (typeof val === 'string' && val.trim().length > 0) return new Date(val);
    return null;
  }).nullable().optional(),
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  officeId: varchar("office_id").references(() => offices.id), // Inherited from patient
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
  officeId: varchar("office_id").references(() => offices.id), // Inherited from patient, stored for performance
  content: text("content").notNull(),
  noteDate: timestamp("note_date"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClinicalNoteSchema = createInsertSchema(clinicalNotes).omit({
  id: true,
  createdAt: true,
}).extend({
  noteDate: z.union([z.date(), z.string()]).transform((val) => {
    if (val instanceof Date) return val;
    if (typeof val === 'string' && val.trim().length > 0) return new Date(val);
    return new Date();
  }).optional(),
});

export type InsertClinicalNote = z.infer<typeof insertClinicalNoteSchema>;
export type ClinicalNote = typeof clinicalNotes.$inferSelect;

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  assignee: text("assignee").notNull(),
  patientId: varchar("patient_id").references(() => patients.id),
  officeId: varchar("office_id").references(() => offices.id), // Inherited from patient if patientId exists
  dueDate: timestamp("due_date"),
  priority: text("priority").notNull().default("normal"),
  status: text("status").notNull().default("pending"),
  completedBy: text("completed_by"), // Who marked the task as completed
  completedAt: timestamp("completed_at"), // When the task was completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedBy: true,  // Exclude from inserts - only set when task is completed
  completedAt: true,  // Exclude from inserts - only set when task is completed
}).extend({
  dueDate: z.union([z.date(), z.string(), z.null()]).transform((val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string' && val.trim().length > 0) {
      return new Date(val);
    }
    return null;
  }).optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const patientFiles = pgTable("patient_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  officeId: varchar("office_id").references(() => offices.id), // Inherited from patient
  filename: text("filename").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  description: text("description"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertPatientFileSchema = createInsertSchema(patientFiles).omit({
  id: true,
  uploadedAt: true,
});

export type InsertPatientFile = z.infer<typeof insertPatientFileSchema>;
export type PatientFile = typeof patientFiles.$inferSelect;

// Lab Notes - for in-house lab work tracking
export const labNotes = pgTable("lab_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  officeId: varchar("office_id").references(() => offices.id), // Inherited from patient
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLabNoteSchema = createInsertSchema(labNotes).omit({
  id: true,
  createdAt: true,
}).extend({
  createdBy: z.string().optional(), // Optional in request, added server-side if missing
});

export type InsertLabNote = z.infer<typeof insertLabNoteSchema>;
export type LabNote = typeof labNotes.$inferSelect;

// Admin Notes - for administrative tracking
export const adminNotes = pgTable("admin_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  officeId: varchar("office_id").references(() => offices.id), // Inherited from patient
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminNoteSchema = createInsertSchema(adminNotes).omit({
  id: true,
  createdAt: true,
}).extend({
  createdBy: z.string().optional(), // Optional in request, added server-side if missing
});

export type InsertAdminNote = z.infer<typeof insertAdminNoteSchema>;
export type AdminNote = typeof adminNotes.$inferSelect;

// Lab Prescriptions - outgoing orders to external labs
export const labPrescriptions = pgTable("lab_prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  officeId: varchar("office_id").references(() => offices.id), // Inherited from patient
  labName: text("lab_name").notNull(), // Vivi Labs, Vital Lab, Aesthetic Minds
  caseType: text("case_type"), // deprecated - kept for backward compatibility
  caseTypeUpper: text("case_type_upper"), // cast partial, complete denture, implant-retained, repair, tooth addition (Max/Maxillary)
  caseTypeLower: text("case_type_lower"), // cast partial, complete denture, implant-retained, repair, tooth addition (Mand)
  arch: text("arch"), // deprecated - kept for backward compatibility
  fabricationStage: text("fabrication_stage"), // deprecated - kept for backward compatibility
  fabricationStageUpper: text("fabrication_stage_upper"), // framework only, try-in, finish, repair (for upper arch)
  fabricationStageLower: text("fabrication_stage_lower"), // framework only, try-in, finish, repair (for lower arch)
  deadline: timestamp("deadline"),
  digitalFiles: text("digital_files").array(), // STL, PLY, bite scan, vestibular scan, etc.
  designInstructions: text("design_instructions"), // explicit design details
  existingDentureReference: text("existing_denture_reference"), // closely followed, loose reference, intentionally modified
  biteNotes: text("bite_notes"), // bite/occlusion information
  shippingInstructions: text("shipping_instructions"), // digital-only return, physical return, etc.
  specialNotes: text("special_notes"), // additional instructions
  status: text("status").notNull().default("draft"), // draft, sent, in_progress, completed
  sentAt: timestamp("sent_at"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLabPrescriptionSchema = createInsertSchema(labPrescriptions).omit({
  id: true,
  createdAt: true,
  sentAt: true,
}).extend({
  createdBy: z.string().optional(), // Optional in request, added server-side if missing
  deadline: z.union([z.date(), z.string()]).transform((val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string' && val.trim().length > 0) {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }).nullable().optional(),
  digitalFiles: z.union([z.array(z.string()), z.undefined()]).optional().transform((val) => {
    if (!val || (Array.isArray(val) && val.length === 0)) return undefined;
    return val;
  }),
  caseTypeUpper: z.union([z.string(), z.undefined()]).optional().transform((val) => {
    if (!val || (typeof val === 'string' && val.trim().length === 0)) return undefined;
    return val;
  }),
  caseTypeLower: z.union([z.string(), z.undefined()]).optional().transform((val) => {
    if (!val || (typeof val === 'string' && val.trim().length === 0)) return undefined;
    return val;
  }),
  fabricationStageUpper: z.union([z.string(), z.undefined()]).optional().transform((val) => {
    if (!val || (typeof val === 'string' && val.trim().length === 0)) return undefined;
    return val;
  }),
  fabricationStageLower: z.union([z.string(), z.undefined()]).optional().transform((val) => {
    if (!val || (typeof val === 'string' && val.trim().length === 0)) return undefined;
    return val;
  }),
  designInstructions: z.union([z.string(), z.undefined()]).optional().transform((val) => {
    if (!val || (typeof val === 'string' && val.trim().length === 0)) return undefined;
    return val;
  }),
  existingDentureReference: z.union([z.string(), z.undefined()]).optional().transform((val) => {
    if (!val || (typeof val === 'string' && val.trim().length === 0)) return undefined;
    return val;
  }),
  biteNotes: z.union([z.string(), z.undefined()]).optional().transform((val) => {
    if (!val || (typeof val === 'string' && val.trim().length === 0)) return undefined;
    return val;
  }),
  shippingInstructions: z.union([z.string(), z.undefined()]).optional().transform((val) => {
    if (!val || (typeof val === 'string' && val.trim().length === 0)) return undefined;
    return val;
  }),
  specialNotes: z.union([z.string(), z.undefined()]).optional().transform((val) => {
    if (!val || (typeof val === 'string' && val.trim().length === 0)) return undefined;
    return val;
  }),
});

export type InsertLabPrescription = z.infer<typeof insertLabPrescriptionSchema>;
export type LabPrescription = typeof labPrescriptions.$inferSelect;
