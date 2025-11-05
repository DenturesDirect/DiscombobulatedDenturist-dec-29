import { 
  type User, type UpsertUser,
  type Patient, type InsertPatient,
  type ClinicalNote, type InsertClinicalNote,
  type Task, type InsertTask,
  type PatientFile, type InsertPatientFile,
  users, patients, clinicalNotes, tasks, patientFiles
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users (Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
  listTasks(assignee?: string): Promise<Task[]>;
  updateTaskStatus(id: string, status: string): Promise<Task | undefined>;
  
  // Files
  createPatientFile(file: InsertPatientFile): Promise<PatientFile>;
  listPatientFiles(patientId: string): Promise<PatientFile[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private patients: Map<string, Patient>;
  private clinicalNotes: Map<string, ClinicalNote>;
  private tasks: Map<string, Task>;
  private patientFiles: Map<string, PatientFile>;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.clinicalNotes = new Map();
    this.tasks = new Map();
    this.patientFiles = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id as string);
    const user: User = {
      id: userData.id as string,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
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
      copayDiscussed: insertPatient.copayDiscussed ?? false,
      currentToothShade: insertPatient.currentToothShade ?? null,
      requestedToothShade: insertPatient.requestedToothShade ?? null,
      createdAt: new Date()
    };
    this.patients.set(id, patient);
    return patient;
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async listPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    const updated = { ...patient, ...updates };
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

  async listTasks(assignee?: string): Promise<Task[]> {
    const allTasks = Array.from(this.tasks.values());
    if (assignee) {
      return allTasks.filter((task) => task.assignee === assignee);
    }
    return allTasks;
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
      ...insertFile, 
      id,
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
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await db.insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date()
        }
      })
      .returning();
    return result[0];
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const result = await db.insert(patients)
      .values(insertPatient)
      .returning();
    return result[0];
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.id, id));
    return result[0];
  }

  async listPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient | undefined> {
    const result = await db.update(patients)
      .set(updates)
      .where(eq(patients.id, id))
      .returning();
    return result[0];
  }

  async createClinicalNote(insertNote: InsertClinicalNote): Promise<ClinicalNote> {
    const result = await db.insert(clinicalNotes)
      .values(insertNote)
      .returning();
    return result[0];
  }

  async listClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
    return await db.select().from(clinicalNotes)
      .where(eq(clinicalNotes.patientId, patientId))
      .orderBy(desc(clinicalNotes.createdAt));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const result = await db.insert(tasks)
      .values(insertTask)
      .returning();
    return result[0];
  }

  async listTasks(assignee?: string): Promise<Task[]> {
    if (assignee) {
      return await db.select().from(tasks)
        .where(eq(tasks.assignee, assignee))
        .orderBy(desc(tasks.createdAt));
    }
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async updateTaskStatus(id: string, status: string): Promise<Task | undefined> {
    const result = await db.update(tasks)
      .set({ status })
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }

  async createPatientFile(insertFile: InsertPatientFile): Promise<PatientFile> {
    const result = await db.insert(patientFiles)
      .values(insertFile)
      .returning();
    return result[0];
  }

  async listPatientFiles(patientId: string): Promise<PatientFile[]> {
    return await db.select().from(patientFiles)
      .where(eq(patientFiles.patientId, patientId))
      .orderBy(desc(patientFiles.uploadedAt));
  }
}

export const storage = new DbStorage();
