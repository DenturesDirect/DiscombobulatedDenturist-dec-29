import { 
  type User, type InsertUser,
  type Patient, type InsertPatient,
  type ClinicalNote, type InsertClinicalNote,
  type Task, type InsertTask,
  type PatientFile, type InsertPatientFile
} from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
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

export const storage = new MemStorage();
