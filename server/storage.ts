import { 
  type User, type UpsertUser,
  type Patient, type InsertPatient,
  type ClinicalNote, type InsertClinicalNote,
  type Task, type InsertTask,
  type PatientFile, type InsertPatientFile,
  type LabNote, type InsertLabNote,
  type AdminNote, type InsertAdminNote,
  type LabPrescription, type InsertLabPrescription,
  users, patients, clinicalNotes, tasks, patientFiles, loginAttempts,
  labNotes, adminNotes, labPrescriptions
} from "@shared/schema";
import { randomUUID } from "crypto";
import { ensureDb } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { USE_MEM_STORAGE } from "./config";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<void>;
  
  // Login Attempts
  logLoginAttempt(email: string, success: boolean, ipAddress?: string): Promise<void>;
  getLoginAttempts(): Promise<Array<{ id: string; email: string; success: boolean; ipAddress: string | null; createdAt: Date }>>;
  
  // Patients
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: string): Promise<Patient | undefined>;
  listPatients(): Promise<Patient[]>;
  updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient | undefined>;
  
  // Clinical Notes
  createClinicalNote(note: InsertClinicalNote): Promise<ClinicalNote>;
  listClinicalNotes(patientId: string): Promise<ClinicalNote[]>;
  
  // Tasks
  createTask(task: InsertTask): Promise<Task>;
  listTasks(assignee?: string, patientId?: string): Promise<Task[]>;
  updateTaskStatus(id: string, status: string): Promise<Task | undefined>;
  
  // Files
  createPatientFile(file: InsertPatientFile): Promise<PatientFile>;
  listPatientFiles(patientId: string): Promise<PatientFile[]>;
  deletePatientFile(id: string): Promise<boolean>;
  
  // Lab Notes
  createLabNote(note: InsertLabNote): Promise<LabNote>;
  listLabNotes(patientId: string): Promise<LabNote[]>;
  
  // Admin Notes
  createAdminNote(note: InsertAdminNote): Promise<AdminNote>;
  listAdminNotes(patientId: string): Promise<AdminNote[]>;
  
  // Lab Prescriptions
  createLabPrescription(prescription: InsertLabPrescription): Promise<LabPrescription>;
  listLabPrescriptions(patientId: string): Promise<LabPrescription[]>;
  getLabPrescription(id: string): Promise<LabPrescription | undefined>;
  updateLabPrescription(id: string, updates: Partial<InsertLabPrescription>): Promise<LabPrescription | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private patients: Map<string, Patient>;
  private clinicalNotes: Map<string, ClinicalNote>;
  private tasks: Map<string, Task>;
  private patientFiles: Map<string, PatientFile>;
  private loginAttemptsStore: Map<string, { id: string; email: string; success: boolean; ipAddress: string | null; createdAt: Date }>;
  private labNotesStore: Map<string, LabNote>;
  private adminNotesStore: Map<string, AdminNote>;
  private labPrescriptionsStore: Map<string, LabPrescription>;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.clinicalNotes = new Map();
    this.tasks = new Map();
    this.patientFiles = new Map();
    this.loginAttemptsStore = new Map();
    this.labNotesStore = new Map();
    this.adminNotesStore = new Map();
    this.labPrescriptionsStore = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email?.toLowerCase() === email.toLowerCase());
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id as string);
    const user: User = {
      id: userData.id as string,
      email: userData.email ?? null,
      password: userData.password ?? existing?.password ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      role: userData.role ?? existing?.role ?? 'staff',
      profileImageUrl: userData.profileImageUrl ?? null,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.password = password;
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  async logLoginAttempt(email: string, success: boolean, ipAddress?: string): Promise<void> {
    const id = randomUUID();
    this.loginAttemptsStore.set(id, {
      id,
      email,
      success,
      ipAddress: ipAddress ?? null,
      createdAt: new Date()
    });
  }

  async getLoginAttempts(): Promise<Array<{ id: string; email: string; success: boolean; ipAddress: string | null; createdAt: Date }>> {
    return Array.from(this.loginAttemptsStore.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const patient: Patient = { 
      id,
      name: insertPatient.name,
      dateOfBirth: insertPatient.dateOfBirth ?? null,
      phone: insertPatient.phone ?? null,
      email: insertPatient.email ?? null,
      isCDCP: insertPatient.isCDCP ?? false,
      workInsurance: insertPatient.workInsurance ?? false,
      copayDiscussed: insertPatient.copayDiscussed ?? false,
      currentToothShade: insertPatient.currentToothShade ?? null,
      requestedToothShade: insertPatient.requestedToothShade ?? null,
      photoUrl: insertPatient.photoUrl ?? null,
      upperDentureType: insertPatient.upperDentureType ?? null,
      lowerDentureType: insertPatient.lowerDentureType ?? null,
      assignedTo: insertPatient.assignedTo ?? null,
      nextStep: insertPatient.nextStep ?? null,
      dueDate: insertPatient.dueDate ?? null,
      lastStepCompleted: insertPatient.lastStepCompleted ?? null,
      lastStepDate: insertPatient.lastStepDate ?? null,
      emailNotifications: insertPatient.emailNotifications ?? false,
      createdAt: new Date()
    };
    this.patients.set(id, patient);
    return patient;
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async listPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const normalizedUpdates: Partial<Patient> = { ...updates };
    if (updates.lastStepDate !== undefined) {
      normalizedUpdates.lastStepDate = updates.lastStepDate as Date | null;
    }
    
    const updated = { ...patient, ...normalizedUpdates };
    this.patients.set(id, updated);
    return updated;
  }

  async createClinicalNote(insertNote: InsertClinicalNote): Promise<ClinicalNote> {
    const id = randomUUID();
    const note: ClinicalNote = { 
      id,
      patientId: insertNote.patientId,
      appointmentId: insertNote.appointmentId ?? null,
      content: insertNote.content,
      createdBy: insertNote.createdBy,
      createdAt: new Date()
    };
    this.clinicalNotes.set(id, note);
    return note;
  }

  async listClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
    return Array.from(this.clinicalNotes.values()).filter(
      (note) => note.patientId === patientId
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = { 
      id,
      title: insertTask.title,
      description: insertTask.description ?? null,
      assignee: insertTask.assignee,
      patientId: insertTask.patientId ?? null,
      dueDate: insertTask.dueDate ?? null,
      priority: insertTask.priority ?? "normal",
      status: insertTask.status ?? "pending",
      createdAt: new Date()
    };
    this.tasks.set(id, task);
    return task;
  }

  async listTasks(assignee?: string, patientId?: string): Promise<Task[]> {
    let allTasks = Array.from(this.tasks.values());
    if (assignee) {
      allTasks = allTasks.filter((task) => task.assignee === assignee);
    }
    if (patientId) {
      allTasks = allTasks.filter((task) => task.patientId === patientId);
    }
    return allTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateTaskStatus(id: string, status: string): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const updated = { ...task, status };
    this.tasks.set(id, updated);
    return updated;
  }

  async createPatientFile(insertFile: InsertPatientFile): Promise<PatientFile> {
    const id = randomUUID();
    const file: PatientFile = { 
      id,
      patientId: insertFile.patientId,
      filename: insertFile.filename,
      fileUrl: insertFile.fileUrl,
      fileType: insertFile.fileType ?? null,
      description: insertFile.description ?? null,
      uploadedAt: new Date()
    };
    this.patientFiles.set(id, file);
    return file;
  }

  async listPatientFiles(patientId: string): Promise<PatientFile[]> {
    return Array.from(this.patientFiles.values()).filter(
      (file) => file.patientId === patientId
    );
  }

  async deletePatientFile(id: string): Promise<boolean> {
    return this.patientFiles.delete(id);
  }

  // Lab Notes
  async createLabNote(insertNote: InsertLabNote): Promise<LabNote> {
    const id = randomUUID();
    const note: LabNote = {
      id,
      patientId: insertNote.patientId,
      content: insertNote.content,
      createdBy: insertNote.createdBy,
      createdAt: new Date()
    };
    this.labNotesStore.set(id, note);
    return note;
  }

  async listLabNotes(patientId: string): Promise<LabNote[]> {
    return Array.from(this.labNotesStore.values())
      .filter((note) => note.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Admin Notes
  async createAdminNote(insertNote: InsertAdminNote): Promise<AdminNote> {
    const id = randomUUID();
    const note: AdminNote = {
      id,
      patientId: insertNote.patientId,
      content: insertNote.content,
      createdBy: insertNote.createdBy,
      createdAt: new Date()
    };
    this.adminNotesStore.set(id, note);
    return note;
  }

  async listAdminNotes(patientId: string): Promise<AdminNote[]> {
    return Array.from(this.adminNotesStore.values())
      .filter((note) => note.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Lab Prescriptions
  async createLabPrescription(insertPrescription: InsertLabPrescription): Promise<LabPrescription> {
    const id = randomUUID();
    const prescription: LabPrescription = {
      id,
      patientId: insertPrescription.patientId,
      labName: insertPrescription.labName,
      caseType: insertPrescription.caseType,
      arch: insertPrescription.arch,
      fabricationStage: insertPrescription.fabricationStage,
      deadline: insertPrescription.deadline ?? null,
      digitalFiles: insertPrescription.digitalFiles ?? null,
      designInstructions: insertPrescription.designInstructions ?? null,
      existingDentureReference: insertPrescription.existingDentureReference ?? null,
      biteNotes: insertPrescription.biteNotes ?? null,
      shippingInstructions: insertPrescription.shippingInstructions ?? null,
      specialNotes: insertPrescription.specialNotes ?? null,
      status: insertPrescription.status ?? "draft",
      sentAt: null,
      createdBy: insertPrescription.createdBy,
      createdAt: new Date()
    };
    this.labPrescriptionsStore.set(id, prescription);
    return prescription;
  }

  async listLabPrescriptions(patientId: string): Promise<LabPrescription[]> {
    return Array.from(this.labPrescriptionsStore.values())
      .filter((rx) => rx.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getLabPrescription(id: string): Promise<LabPrescription | undefined> {
    return this.labPrescriptionsStore.get(id);
  }

  async updateLabPrescription(id: string, updates: Partial<InsertLabPrescription>): Promise<LabPrescription | undefined> {
    const prescription = this.labPrescriptionsStore.get(id);
    if (!prescription) return undefined;
    const updated = { ...prescription, ...updates };
    this.labPrescriptionsStore.set(id, updated);
    return updated;
  }
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await ensureDb().select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await ensureDb().select().from(users).where(eq(users.email, email.toLowerCase()));
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await ensureDb().insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date()
        }
      })
      .returning();
    return result[0];
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    await ensureDb().update(users)
      .set({ password, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async logLoginAttempt(email: string, success: boolean, ipAddress?: string): Promise<void> {
    await ensureDb().insert(loginAttempts)
      .values({ email, success, ipAddress: ipAddress ?? null });
  }

  async getLoginAttempts(): Promise<Array<{ id: string; email: string; success: boolean; ipAddress: string | null; createdAt: Date }>> {
    return await ensureDb().select().from(loginAttempts).orderBy(desc(loginAttempts.createdAt)).limit(100);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const result = await ensureDb().insert(patients)
      .values(insertPatient)
      .returning();
    return result[0];
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const result = await ensureDb().select().from(patients).where(eq(patients.id, id));
    return result[0];
  }

  async listPatients(): Promise<Patient[]> {
    return await ensureDb().select().from(patients).orderBy(desc(patients.createdAt));
  }

  async updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient | undefined> {
    const result = await ensureDb().update(patients)
      .set(updates)
      .where(eq(patients.id, id))
      .returning();
    return result[0];
  }

  async createClinicalNote(insertNote: InsertClinicalNote): Promise<ClinicalNote> {
    const result = await ensureDb().insert(clinicalNotes)
      .values(insertNote)
      .returning();
    return result[0];
  }

  async listClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
    return await ensureDb().select().from(clinicalNotes)
      .where(eq(clinicalNotes.patientId, patientId))
      .orderBy(desc(clinicalNotes.createdAt));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const result = await ensureDb().insert(tasks)
      .values(insertTask)
      .returning();
    return result[0];
  }

  async listTasks(assignee?: string, patientId?: string): Promise<Task[]> {
    const conditions = [];
    if (assignee) {
      conditions.push(eq(tasks.assignee, assignee));
    }
    if (patientId) {
      conditions.push(eq(tasks.patientId, patientId));
    }
    
    if (conditions.length === 0) {
      return await ensureDb().select().from(tasks).orderBy(desc(tasks.createdAt));
    }
    
    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
    return await ensureDb().select().from(tasks).where(whereClause!).orderBy(desc(tasks.createdAt));
  }

  async updateTaskStatus(id: string, status: string): Promise<Task | undefined> {
    const result = await ensureDb().update(tasks)
      .set({ status })
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }

  async createPatientFile(insertFile: InsertPatientFile): Promise<PatientFile> {
    const result = await ensureDb().insert(patientFiles)
      .values(insertFile)
      .returning();
    return result[0];
  }

  async listPatientFiles(patientId: string): Promise<PatientFile[]> {
    return await ensureDb().select().from(patientFiles)
      .where(eq(patientFiles.patientId, patientId))
      .orderBy(desc(patientFiles.uploadedAt));
  }

  async deletePatientFile(id: string): Promise<boolean> {
    const result = await ensureDb().delete(patientFiles)
      .where(eq(patientFiles.id, id))
      .returning();
    return result.length > 0;
  }

  // Lab Notes
  async createLabNote(insertNote: InsertLabNote): Promise<LabNote> {
    const result = await ensureDb().insert(labNotes)
      .values(insertNote)
      .returning();
    return result[0];
  }

  async listLabNotes(patientId: string): Promise<LabNote[]> {
    return await ensureDb().select().from(labNotes)
      .where(eq(labNotes.patientId, patientId))
      .orderBy(desc(labNotes.createdAt));
  }

  // Admin Notes
  async createAdminNote(insertNote: InsertAdminNote): Promise<AdminNote> {
    const result = await ensureDb().insert(adminNotes)
      .values(insertNote)
      .returning();
    return result[0];
  }

  async listAdminNotes(patientId: string): Promise<AdminNote[]> {
    return await ensureDb().select().from(adminNotes)
      .where(eq(adminNotes.patientId, patientId))
      .orderBy(desc(adminNotes.createdAt));
  }

  // Lab Prescriptions
  async createLabPrescription(insertPrescription: InsertLabPrescription): Promise<LabPrescription> {
    const result = await ensureDb().insert(labPrescriptions)
      .values(insertPrescription)
      .returning();
    return result[0];
  }

  async listLabPrescriptions(patientId: string): Promise<LabPrescription[]> {
    return await ensureDb().select().from(labPrescriptions)
      .where(eq(labPrescriptions.patientId, patientId))
      .orderBy(desc(labPrescriptions.createdAt));
  }

  async getLabPrescription(id: string): Promise<LabPrescription | undefined> {
    const result = await ensureDb().select().from(labPrescriptions)
      .where(eq(labPrescriptions.id, id));
    return result[0];
  }

  async updateLabPrescription(id: string, updates: Partial<InsertLabPrescription>): Promise<LabPrescription | undefined> {
    const result = await ensureDb().update(labPrescriptions)
      .set(updates)
      .where(eq(labPrescriptions.id, id))
      .returning();
    return result[0];
  }
}

function createStorage(): IStorage {
  if (USE_MEM_STORAGE) {
    console.log('🧠 Using in-memory storage');
    return new MemStorage();
  }
  
  try {
    console.log('💾 Using database storage');
    return new DbStorage();
  } catch (error) {
    console.warn('⚠️  Database connection failed, falling back to in-memory storage');
    return new MemStorage();
  }
}

export const storage = createStorage();
