import { 
  type User, type UpsertUser,
  type Patient, type InsertPatient,
  type ClinicalNote, type InsertClinicalNote,
  type Task, type InsertTask,
  type PatientFile, type InsertPatientFile,
  type LabNote, type InsertLabNote,
  type AdminNote, type InsertAdminNote,
  type LabPrescription, type InsertLabPrescription,
  type Office,
  users, patients, clinicalNotes, tasks, patientFiles, loginAttempts,
  labNotes, adminNotes, labPrescriptions, offices
} from "@shared/schema";
import { randomUUID } from "crypto";
import { ensureDb } from "./db";
import { eq, desc, and, ne, or, isNull } from "drizzle-orm";
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
  getPatient(id: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<Patient | undefined>;
  listPatients(userOfficeId?: string | null, canViewAllOffices?: boolean, selectedOfficeId?: string | null): Promise<Patient[]>;
  updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient | undefined>;
  
  // Clinical Notes
  createClinicalNote(note: InsertClinicalNote): Promise<ClinicalNote>;
  listClinicalNotes(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<ClinicalNote[]>;
  updateClinicalNote(id: string, updates: Partial<InsertClinicalNote>): Promise<ClinicalNote | undefined>;
  deleteClinicalNote(id: string): Promise<boolean>;
  
  // Tasks
  createTask(task: InsertTask): Promise<Task>;
  listTasks(assignee?: string, patientId?: string, userOfficeId?: string | null, canViewAllOffices?: boolean, selectedOfficeId?: string | null): Promise<Task[]>;
  listArchivedTasks(userOfficeId?: string | null, canViewAllOffices?: boolean, selectedOfficeId?: string | null): Promise<Task[]>;
  updateTaskStatus(id: string, status: string, completedBy?: string): Promise<Task | undefined>;
  
  // Files
  createPatientFile(file: InsertPatientFile): Promise<PatientFile>;
  listPatientFiles(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<PatientFile[]>;
  deletePatientFile(id: string): Promise<boolean>;
  
  // Lab Notes
  createLabNote(note: InsertLabNote): Promise<LabNote>;
  listLabNotes(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<LabNote[]>;
  updateLabNote(id: string, updates: Partial<InsertLabNote>): Promise<LabNote | undefined>;
  
  // Admin Notes
  createAdminNote(note: InsertAdminNote): Promise<AdminNote>;
  listAdminNotes(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<AdminNote[]>;
  
  // Lab Prescriptions
  createLabPrescription(prescription: InsertLabPrescription): Promise<LabPrescription>;
  listLabPrescriptions(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<LabPrescription[]>;
  getLabPrescription(id: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<LabPrescription | undefined>;
  updateLabPrescription(id: string, updates: Partial<InsertLabPrescription>): Promise<LabPrescription | undefined>;
  
  // Offices
  listOffices(): Promise<Office[]>;
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
      officeId: userData.officeId ?? existing?.officeId ?? null,
      canViewAllOffices: userData.canViewAllOffices ?? existing?.canViewAllOffices ?? false,
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
      officeId: insertPatient.officeId || '',
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
      textNotifications: insertPatient.textNotifications ?? false,
      examPaid: insertPatient.examPaid ?? null,
      repairPaid: insertPatient.repairPaid ?? null,
      newDenturePaid: insertPatient.newDenturePaid ?? null,
      predeterminationStatus: insertPatient.predeterminationStatus ?? null,
      treatmentInitiationDate: insertPatient.treatmentInitiationDate ?? null,
      createdAt: new Date()
    };
    this.patients.set(id, patient);
    return patient;
  }

  async getPatient(id: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    // If user can view all offices, return patient
    if (canViewAllOffices) return patient;
    
    // If user has office restriction, check if patient belongs to their office
    if (userOfficeId && patient.officeId !== userOfficeId) return undefined;
    
    return patient;
  }

  async listPatients(userOfficeId?: string | null, canViewAllOffices?: boolean, selectedOfficeId?: string | null): Promise<Patient[]> {
    let allPatients = Array.from(this.patients.values());
    
    // If user can view all offices and has selected a specific office, filter by that
    if (canViewAllOffices && selectedOfficeId) {
      allPatients = allPatients.filter(p => p.officeId === selectedOfficeId);
    }
    // If user cannot view all offices, filter by their office
    else if (!canViewAllOffices && userOfficeId) {
      allPatients = allPatients.filter(p => p.officeId === userOfficeId);
    }
    // If user can view all offices and no office selected, return all
    
    return allPatients.sort((a, b) => 
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
    // Normalize treatmentInitiationDate - convert string to Date if needed
    if (updates.treatmentInitiationDate !== undefined) {
      const dateValue = updates.treatmentInitiationDate;
      if (dateValue instanceof Date) {
        normalizedUpdates.treatmentInitiationDate = dateValue;
      } else if (dateValue && typeof dateValue === 'string') {
        const trimmed = (dateValue as string).trim();
        if (trimmed.length > 0) {
          normalizedUpdates.treatmentInitiationDate = new Date(trimmed);
        } else {
          normalizedUpdates.treatmentInitiationDate = null;
        }
      } else {
        normalizedUpdates.treatmentInitiationDate = null;
      }
    }
    
    const updated = { ...patient, ...normalizedUpdates };
    this.patients.set(id, updated);
    return updated;
  }

  async createClinicalNote(insertNote: InsertClinicalNote): Promise<ClinicalNote> {
    const id = randomUUID();
    // Get patient to inherit officeId
    const patient = this.patients.get(insertNote.patientId);
    const note: ClinicalNote = { 
      id,
      patientId: insertNote.patientId,
      appointmentId: insertNote.appointmentId ?? null,
      officeId: insertNote.officeId ?? patient?.officeId ?? null,
      content: insertNote.content,
      noteDate: insertNote.noteDate ?? null,
      createdBy: insertNote.createdBy || '',
      createdAt: new Date()
    };
    this.clinicalNotes.set(id, note);
    return note;
  }

  async listClinicalNotes(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<ClinicalNote[]> {
    // First check if user can access this patient
    const patient = await this.getPatient(patientId, userOfficeId, canViewAllOffices);
    if (!patient) return [];
    
    return Array.from(this.clinicalNotes.values()).filter(
      (note) => note.patientId === patientId
    );
  }

  async updateClinicalNote(id: string, updates: Partial<InsertClinicalNote>): Promise<ClinicalNote | undefined> {
    const note = this.clinicalNotes.get(id);
    if (!note) return undefined;
    const updated = { ...note, ...updates };
    this.clinicalNotes.set(id, updated);
    return updated;
  }

  async deleteClinicalNote(id: string): Promise<boolean> {
    return this.clinicalNotes.delete(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    // Get patient to inherit officeId if task is patient-related
    const patient = insertTask.patientId ? this.patients.get(insertTask.patientId) : null;
    const task: Task = { 
      id,
      title: insertTask.title,
      description: insertTask.description ?? null,
      assignee: insertTask.assignee,
      patientId: insertTask.patientId ?? null,
      officeId: insertTask.officeId ?? patient?.officeId ?? null,
      dueDate: insertTask.dueDate ?? null,
      priority: insertTask.priority ?? "normal",
      status: insertTask.status ?? "pending",
      completedBy: null,
      completedAt: null,
      createdAt: new Date()
    };
    this.tasks.set(id, task);
    return task;
  }

  async listTasks(assignee?: string, patientId?: string, userOfficeId?: string | null, canViewAllOffices?: boolean, selectedOfficeId?: string | null): Promise<Task[]> {
    let allTasks = Array.from(this.tasks.values());
    
    // Exclude completed tasks from active task list
    allTasks = allTasks.filter(task => task.status !== "completed");
    
    // Filter by office
    if (canViewAllOffices && selectedOfficeId) {
      // User can view all but has selected a specific office
      allTasks = allTasks.filter(task => {
        if (task.patientId) {
          const patient = this.patients.get(task.patientId);
          return patient?.officeId === selectedOfficeId;
        }
        return task.officeId === selectedOfficeId;
      });
    } else if (!canViewAllOffices && userOfficeId) {
      // User can only see their office
      allTasks = allTasks.filter(task => {
        if (task.patientId) {
          const patient = this.patients.get(task.patientId);
          return patient?.officeId === userOfficeId;
        }
        return task.officeId === userOfficeId;
      });
    }
    
    if (assignee) {
      allTasks = allTasks.filter((task) => task.assignee === assignee);
    }
    if (patientId) {
      allTasks = allTasks.filter((task) => task.patientId === patientId);
    }
    return allTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async listArchivedTasks(userOfficeId?: string | null, canViewAllOffices?: boolean, selectedOfficeId?: string | null): Promise<Task[]> {
    let allTasks = Array.from(this.tasks.values());
    
    // Only include completed tasks
    allTasks = allTasks.filter(task => task.status === "completed");
    
    // Filter by office
    if (canViewAllOffices && selectedOfficeId) {
      allTasks = allTasks.filter(task => {
        if (task.patientId) {
          const patient = this.patients.get(task.patientId);
          return patient?.officeId === selectedOfficeId;
        }
        return task.officeId === selectedOfficeId;
      });
    } else if (!canViewAllOffices && userOfficeId) {
      allTasks = allTasks.filter(task => {
        if (task.patientId) {
          const patient = this.patients.get(task.patientId);
          return patient?.officeId === userOfficeId;
        }
        return task.officeId === userOfficeId;
      });
    }
    
    return allTasks.sort((a, b) => {
      // Sort by completedAt descending (most recent first), fallback to createdAt
      const aDate = a.completedAt || a.createdAt;
      const bDate = b.completedAt || b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });
  }

  async updateTaskStatus(id: string, status: string, completedBy?: string): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const updated: Task = { 
      ...task, 
      status,
      completedBy: status === "completed" ? (completedBy || null) : null,
      completedAt: status === "completed" ? new Date() : null
    };
    this.tasks.set(id, updated);
    return updated;
  }

  async createPatientFile(insertFile: InsertPatientFile): Promise<PatientFile> {
    const id = randomUUID();
    const patient = this.patients.get(insertFile.patientId);
    const file: PatientFile = { 
      id,
      patientId: insertFile.patientId,
      officeId: insertFile.officeId ?? patient?.officeId ?? null,
      filename: insertFile.filename,
      fileUrl: insertFile.fileUrl,
      fileType: insertFile.fileType ?? null,
      description: insertFile.description ?? null,
      uploadedAt: new Date()
    };
    this.patientFiles.set(id, file);
    return file;
  }

  async listPatientFiles(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<PatientFile[]> {
    // First check if user can access this patient
    const patient = await this.getPatient(patientId, userOfficeId, canViewAllOffices);
    if (!patient) return [];
    
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
    const patient = this.patients.get(insertNote.patientId);
    const note: LabNote = {
      id,
      patientId: insertNote.patientId,
      officeId: insertNote.officeId ?? patient?.officeId ?? null,
      content: insertNote.content,
      createdBy: insertNote.createdBy || '',
      createdAt: new Date()
    };
    this.labNotesStore.set(id, note);
    return note;
  }

  async listLabNotes(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<LabNote[]> {
    // First check if user can access this patient
    const patient = await this.getPatient(patientId, userOfficeId, canViewAllOffices);
    if (!patient) return [];
    
    return Array.from(this.labNotesStore.values())
      .filter((note) => note.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateLabNote(id: string, updates: Partial<InsertLabNote>): Promise<LabNote | undefined> {
    const note = this.labNotesStore.get(id);
    if (!note) return undefined;
    const updated = { ...note, ...updates };
    this.labNotesStore.set(id, updated);
    return updated;
  }

  // Admin Notes
  async createAdminNote(insertNote: InsertAdminNote): Promise<AdminNote> {
    const id = randomUUID();
    const patient = this.patients.get(insertNote.patientId);
    const note: AdminNote = {
      id,
      patientId: insertNote.patientId,
      officeId: insertNote.officeId ?? patient?.officeId ?? null,
      content: insertNote.content,
      createdBy: insertNote.createdBy || '',
      createdAt: new Date()
    };
    this.adminNotesStore.set(id, note);
    return note;
  }

  async listAdminNotes(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<AdminNote[]> {
    // First check if user can access this patient
    const patient = await this.getPatient(patientId, userOfficeId, canViewAllOffices);
    if (!patient) return [];
    
    return Array.from(this.adminNotesStore.values())
      .filter((note) => note.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Lab Prescriptions
  async createLabPrescription(insertPrescription: InsertLabPrescription): Promise<LabPrescription> {
    const id = randomUUID();
    const patient = this.patients.get(insertPrescription.patientId);
    const prescription: LabPrescription = {
      id,
      patientId: insertPrescription.patientId,
      officeId: insertPrescription.officeId ?? patient?.officeId ?? null,
      labName: insertPrescription.labName,
      caseType: insertPrescription.caseType ?? null,
      caseTypeUpper: insertPrescription.caseTypeUpper ?? null,
      caseTypeLower: insertPrescription.caseTypeLower ?? null,
      arch: insertPrescription.arch ?? null,
      fabricationStage: insertPrescription.fabricationStage ?? null,
      fabricationStageUpper: insertPrescription.fabricationStageUpper ?? null,
      fabricationStageLower: insertPrescription.fabricationStageLower ?? null,
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

  async listLabPrescriptions(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<LabPrescription[]> {
    // First check if user can access this patient
    const patient = await this.getPatient(patientId, userOfficeId, canViewAllOffices);
    if (!patient) return [];
    
    return Array.from(this.labPrescriptionsStore.values())
      .filter((rx) => rx.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getLabPrescription(id: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<LabPrescription | undefined> {
    const prescription = this.labPrescriptionsStore.get(id);
    if (!prescription) return undefined;
    
    // Check if user can access the patient this prescription belongs to
    const patient = await this.getPatient(prescription.patientId, userOfficeId, canViewAllOffices);
    if (!patient) return undefined;
    
    return prescription;
  }

  async updateLabPrescription(id: string, updates: Partial<InsertLabPrescription>): Promise<LabPrescription | undefined> {
    const prescription = this.labPrescriptionsStore.get(id);
    if (!prescription) return undefined;
    const updated = { ...prescription, ...updates };
    this.labPrescriptionsStore.set(id, updated);
    return updated;
  }

  async listOffices(): Promise<Office[]> {
    // For MemStorage, return empty array or seed with default offices
    // In production, this should come from the database
    return [];
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
          officeId: userData.officeId,
          canViewAllOffices: userData.canViewAllOffices,
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
    // Ensure officeId is set - it's required by the schema
    if (!insertPatient.officeId) {
      throw new Error("officeId is required. Patient must be assigned to an office.");
    }
    
    // Ensure officeId is set (required by schema)
    if (!insertPatient.officeId) {
      throw new Error("officeId is required. Patient must be assigned to an office.");
    }
    
    const result = await ensureDb().insert(patients)
      .values({
        ...insertPatient,
        officeId: insertPatient.officeId,
      })
      .returning();
    return result[0];
  }

  async getPatient(id: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<Patient | undefined> {
    let query = ensureDb().select().from(patients);
    
    // Apply office filter if user cannot view all offices
    if (!canViewAllOffices && userOfficeId) {
      query = query.where(and(eq(patients.id, id), eq(patients.officeId, userOfficeId))) as any;
    } else {
      query = query.where(eq(patients.id, id)) as any;
    }
    
    const result = await query;
    return result[0];
  }

  async listPatients(userOfficeId?: string | null, canViewAllOffices?: boolean, selectedOfficeId?: string | null): Promise<Patient[]> {
    let query = ensureDb().select().from(patients);
    
    // If user can view all offices and has selected a specific office, filter by that
    if (canViewAllOffices && selectedOfficeId) {
      query = query.where(eq(patients.officeId, selectedOfficeId)) as any;
    }
    // If user cannot view all offices, filter by their office
    else if (!canViewAllOffices && userOfficeId) {
      query = query.where(eq(patients.officeId, userOfficeId)) as any;
    }
    // If user can view all offices and no office selected, return all (no filter)
    
    return await query.orderBy(desc(patients.createdAt));
  }

  async updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient | undefined> {
    // Normalize date fields - convert strings to Date objects for timestamp columns
    const normalizedUpdates: any = { ...updates };
    
    if (updates.treatmentInitiationDate !== undefined) {
      const dateValue = updates.treatmentInitiationDate;
      if (dateValue instanceof Date) {
        normalizedUpdates.treatmentInitiationDate = dateValue;
      } else if (dateValue && typeof dateValue === 'string') {
        const trimmed = (dateValue as string).trim();
        if (trimmed.length > 0) {
          normalizedUpdates.treatmentInitiationDate = new Date(trimmed);
        } else {
          normalizedUpdates.treatmentInitiationDate = null;
        }
      } else {
        normalizedUpdates.treatmentInitiationDate = null;
      }
    }
    
    if (updates.lastStepDate !== undefined) {
      const dateValue = updates.lastStepDate;
      if (dateValue instanceof Date) {
        normalizedUpdates.lastStepDate = dateValue;
      } else if (dateValue && typeof dateValue === 'string') {
        const trimmed = (dateValue as string).trim();
        if (trimmed.length > 0) {
          normalizedUpdates.lastStepDate = new Date(trimmed);
        } else {
          normalizedUpdates.lastStepDate = null;
        }
      } else {
        normalizedUpdates.lastStepDate = null;
      }
    }
    
    const result = await ensureDb().update(patients)
      .set(normalizedUpdates)
      .where(eq(patients.id, id))
      .returning();
    return result[0];
  }

  async createClinicalNote(insertNote: InsertClinicalNote): Promise<ClinicalNote> {
    // If officeId not provided, get it from patient
    // Note: We bypass office restrictions here since we're creating a note for an existing patient
    if (!insertNote.officeId) {
      try {
        // Use a direct query to get patient without office restrictions for note creation
        const patientResult = await ensureDb().select().from(patients).where(eq(patients.id, insertNote.patientId)).limit(1);
        if (patientResult.length > 0 && patientResult[0].officeId) {
          insertNote.officeId = patientResult[0].officeId;
        }
      } catch (error) {
        console.error("Error getting patient officeId for clinical note:", error);
        // Continue without officeId - it can be null
      }
    }
    
    try {
      const result = await ensureDb().insert(clinicalNotes)
        .values(insertNote)
        .returning();
      
      if (!result || result.length === 0) {
        throw new Error("Failed to create clinical note - no result returned");
      }
      
      console.log(`✅ Clinical note created: ID=${result[0].id}, PatientID=${insertNote.patientId}, OfficeID=${insertNote.officeId || 'null'}`);
      return result[0];
    } catch (error: any) {
      console.error("❌ Error creating clinical note:", error);
      console.error("   Patient ID:", insertNote.patientId);
      console.error("   Office ID:", insertNote.officeId);
      console.error("   Content length:", insertNote.content?.length || 0);
      throw error;
    }
  }

  async listClinicalNotes(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<ClinicalNote[]> {
    // First check if user can access this patient
    const patient = await this.getPatient(patientId, userOfficeId, canViewAllOffices);
    if (!patient) return [];
    
    return await ensureDb().select().from(clinicalNotes)
      .where(eq(clinicalNotes.patientId, patientId))
      .orderBy(desc(clinicalNotes.createdAt));
  }

  async updateClinicalNote(id: string, updates: Partial<InsertClinicalNote>): Promise<ClinicalNote | undefined> {
    const result = await ensureDb().update(clinicalNotes)
      .set(updates)
      .where(eq(clinicalNotes.id, id))
      .returning();
    return result[0];
  }

  async deleteClinicalNote(id: string): Promise<boolean> {
    const result = await ensureDb().delete(clinicalNotes)
      .where(eq(clinicalNotes.id, id))
      .returning();
    return result.length > 0;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    // If officeId not provided and task is patient-related, get it from patient
    if (!insertTask.officeId && insertTask.patientId) {
      const patient = await this.getPatient(insertTask.patientId);
      if (patient) {
        insertTask.officeId = patient.officeId;
      }
    }
    
    // Remove completedBy and completedAt from insert - these columns may not exist in the database yet
    const { completedBy, completedAt, ...taskData } = insertTask as any;
    
    const result = await ensureDb().insert(tasks)
      .values(taskData)
      .returning();
    return result[0];
  }

  async listTasks(assignee?: string, patientId?: string, userOfficeId?: string | null, canViewAllOffices?: boolean, selectedOfficeId?: string | null): Promise<Task[]> {
    const conditions = [];
    
    // Office filtering - for tasks, we need to check patient's office
    // This is complex with drizzle, so we'll filter after fetching if needed
    let allTasks: Task[];
    
    // Exclude completed tasks - only show pending/active tasks
    const baseConditions = [ne(tasks.status, "completed")];
    
    if (assignee) {
      baseConditions.push(eq(tasks.assignee, assignee));
    }
    if (patientId) {
      baseConditions.push(eq(tasks.patientId, patientId));
    }
    
    if (baseConditions.length === 1) {
      allTasks = await ensureDb().select().from(tasks).where(baseConditions[0]).orderBy(desc(tasks.createdAt));
    } else {
      const whereClause = and(...baseConditions);
      allTasks = await ensureDb().select().from(tasks).where(whereClause!).orderBy(desc(tasks.createdAt));
    }
    
    console.log(`🔍 listTasks: Found ${allTasks.length} tasks before office filtering`);
    
    // Apply office filtering - but be more lenient
    if (canViewAllOffices && selectedOfficeId) {
      // Filter by selected office - need to check patient's office
      const filteredTasks = [];
      for (const task of allTasks) {
        let taskOfficeId: string | null = null;
        
        // Try to get officeId from task first
        if (task.officeId) {
          taskOfficeId = task.officeId;
        } else if (task.patientId) {
          // Try to get from patient, but don't fail if patient doesn't exist
          try {
            const patient = await this.getPatient(task.patientId, null, true);
            taskOfficeId = patient?.officeId || null;
          } catch (error) {
            console.warn(`⚠️  Could not get patient ${task.patientId} for task ${task.id}:`, error);
            // If we can't get the patient, include the task anyway to avoid losing data
            filteredTasks.push(task);
            continue;
          }
        }
        
        // Include task if office matches, or if we couldn't determine office (to avoid data loss)
        if (!taskOfficeId || taskOfficeId === selectedOfficeId) {
          filteredTasks.push(task);
        }
      }
      console.log(`🔍 listTasks: After office filtering (selectedOfficeId=${selectedOfficeId}): ${filteredTasks.length} tasks`);
      return filteredTasks;
    } else if (!canViewAllOffices && userOfficeId) {
      // Filter by user's office
      const filteredTasks = [];
      for (const task of allTasks) {
        let taskOfficeId: string | null = null;
        
        // Try to get officeId from task first
        if (task.officeId) {
          taskOfficeId = task.officeId;
        } else if (task.patientId) {
          // Try to get from patient, but don't fail if patient doesn't exist
          try {
            const patient = await this.getPatient(task.patientId, userOfficeId, false);
            taskOfficeId = patient?.officeId || null;
          } catch (error) {
            console.warn(`⚠️  Could not get patient ${task.patientId} for task ${task.id}:`, error);
            // If we can't get the patient, don't include the task (user can't see it)
            continue;
          }
        }
        
        // Include task if office matches
        if (taskOfficeId === userOfficeId) {
          filteredTasks.push(task);
        }
      }
      console.log(`🔍 listTasks: After office filtering (userOfficeId=${userOfficeId}): ${filteredTasks.length} tasks`);
      return filteredTasks;
    }
    
    console.log(`🔍 listTasks: No office filtering applied, returning all ${allTasks.length} tasks`);
    return allTasks;
  }

  async listArchivedTasks(userOfficeId?: string | null, canViewAllOffices?: boolean, selectedOfficeId?: string | null): Promise<Task[]> {
    // Only fetch completed tasks - order by completedAt if available, otherwise createdAt
    let allTasks = await ensureDb().select().from(tasks)
      .where(eq(tasks.status, "completed"));
    
    // Sort by completedAt descending (most recent first), fallback to createdAt
    allTasks.sort((a, b) => {
      const aDate = a.completedAt || a.createdAt;
      const bDate = b.completedAt || b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });
    
    // Apply office filtering
    if (canViewAllOffices && selectedOfficeId) {
      const filteredTasks = [];
      for (const task of allTasks) {
        if (task.patientId) {
          const patient = await this.getPatient(task.patientId);
          if (patient?.officeId === selectedOfficeId) {
            filteredTasks.push(task);
          }
        } else if (task.officeId === selectedOfficeId) {
          filteredTasks.push(task);
        }
      }
      return filteredTasks;
    } else if (!canViewAllOffices && userOfficeId) {
      const filteredTasks = [];
      for (const task of allTasks) {
        if (task.patientId) {
          const patient = await this.getPatient(task.patientId);
          if (patient?.officeId === userOfficeId) {
            filteredTasks.push(task);
          }
        } else if (task.officeId === userOfficeId) {
          filteredTasks.push(task);
        }
      }
      return filteredTasks;
    }
    
    return allTasks;
  }

  async updateTaskStatus(id: string, status: string, completedBy?: string): Promise<Task | undefined> {
    const updateData: any = { status };
    if (status === "completed") {
      updateData.completedBy = completedBy || null;
      updateData.completedAt = new Date();
    } else {
      updateData.completedBy = null;
      updateData.completedAt = null;
    }
    
    const result = await ensureDb().update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }

  async createPatientFile(insertFile: InsertPatientFile): Promise<PatientFile> {
    // If officeId not provided, get it from patient
    if (!insertFile.officeId) {
      const patient = await this.getPatient(insertFile.patientId);
      if (patient) {
        insertFile.officeId = patient.officeId;
      }
    }
    
    const result = await ensureDb().insert(patientFiles)
      .values(insertFile)
      .returning();
    return result[0];
  }

  async listPatientFiles(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<PatientFile[]> {
    // First check if user can access this patient
    const patient = await this.getPatient(patientId, userOfficeId, canViewAllOffices);
    if (!patient) return [];
    
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
    // If officeId not provided, get it from patient
    if (!insertNote.officeId) {
      const patient = await this.getPatient(insertNote.patientId);
      if (patient) {
        insertNote.officeId = patient.officeId;
      }
    }
    
    // Ensure createdBy is set (required by schema)
    if (!insertNote.createdBy) {
      throw new Error("createdBy is required for lab notes");
    }
    
    const result = await ensureDb().insert(labNotes)
      .values({
        ...insertNote,
        createdBy: insertNote.createdBy || '',
      })
      .returning();
    return result[0];
  }

  async listLabNotes(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<LabNote[]> {
    // First check if user can access this patient
    const patient = await this.getPatient(patientId, userOfficeId, canViewAllOffices);
    if (!patient) return [];
    
    return await ensureDb().select().from(labNotes)
      .where(eq(labNotes.patientId, patientId))
      .orderBy(desc(labNotes.createdAt));
  }

  async updateLabNote(id: string, updates: Partial<InsertLabNote>): Promise<LabNote | undefined> {
    const result = await ensureDb().update(labNotes)
      .set(updates)
      .where(eq(labNotes.id, id))
      .returning();
    return result[0];
  }

  // Admin Notes
  async createAdminNote(insertNote: InsertAdminNote): Promise<AdminNote> {
    // If officeId not provided, get it from patient
    if (!insertNote.officeId) {
      const patient = await this.getPatient(insertNote.patientId);
      if (patient) {
        insertNote.officeId = patient.officeId;
      }
    }
    
    // Ensure createdBy is set (required by schema)
    if (!insertNote.createdBy) {
      throw new Error("createdBy is required for admin notes");
    }
    
    const result = await ensureDb().insert(adminNotes)
      .values({
        ...insertNote,
        createdBy: insertNote.createdBy || '',
      })
      .returning();
    return result[0];
  }

  async listAdminNotes(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<AdminNote[]> {
    // First check if user can access this patient
    const patient = await this.getPatient(patientId, userOfficeId, canViewAllOffices);
    if (!patient) return [];
    
    return await ensureDb().select().from(adminNotes)
      .where(eq(adminNotes.patientId, patientId))
      .orderBy(desc(adminNotes.createdAt));
  }

  // Lab Prescriptions
  async createLabPrescription(insertPrescription: InsertLabPrescription): Promise<LabPrescription> {
    // If officeId not provided, get it from patient
    if (!insertPrescription.officeId) {
      const patient = await this.getPatient(insertPrescription.patientId);
      if (patient) {
        insertPrescription.officeId = patient.officeId;
      }
    }
    
    const result = await ensureDb().insert(labPrescriptions)
      .values(insertPrescription)
      .returning();
    return result[0];
  }

  async listLabPrescriptions(patientId: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<LabPrescription[]> {
    // First check if user can access this patient
    const patient = await this.getPatient(patientId, userOfficeId, canViewAllOffices);
    if (!patient) return [];
    
    return await ensureDb().select().from(labPrescriptions)
      .where(eq(labPrescriptions.patientId, patientId))
      .orderBy(desc(labPrescriptions.createdAt));
  }

  async getLabPrescription(id: string, userOfficeId?: string | null, canViewAllOffices?: boolean): Promise<LabPrescription | undefined> {
    const result = await ensureDb().select().from(labPrescriptions)
      .where(eq(labPrescriptions.id, id));
    const prescription = result[0];
    if (!prescription) return undefined;
    
    // Check if user can access the patient this prescription belongs to
    const patient = await this.getPatient(prescription.patientId, userOfficeId, canViewAllOffices);
    if (!patient) return undefined;
    
    return prescription;
  }

  async updateLabPrescription(id: string, updates: Partial<InsertLabPrescription>): Promise<LabPrescription | undefined> {
    const result = await ensureDb().update(labPrescriptions)
      .set(updates)
      .where(eq(labPrescriptions.id, id))
      .returning();
    return result[0];
  }

  async listOffices(): Promise<Office[]> {
    return await ensureDb().select().from(offices).orderBy(offices.name);
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
