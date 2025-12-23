import type { Express } from "express";
import { createServer, type Server } from "http";
import { processClinicalNote, generateReferralLetter } from "./openai";
import { storage } from "./storage";
import { insertPatientSchema, insertLabNoteSchema, insertAdminNoteSchema, insertLabPrescriptionSchema } from "@shared/schema";
import { setupLocalAuth, isAuthenticated, seedStaffAccounts } from "./localAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { sendCustomNotification, sendAppointmentReminder } from "./gmail";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupLocalAuth(app);
  await seedStaffAccounts();

  app.post("/api/patients", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.json(patient);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/patients", isAuthenticated, async (req, res) => {
    try {
      const patients = await storage.listPatients();
      res.json(patients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      res.json(patient);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Helper function to calculate next business day (Mon-Fri)
  function getNextBusinessDay(): Date {
    const now = new Date();
    const result = new Date(now);
    result.setDate(result.getDate() + 1);
    
    // Skip weekends
    while (result.getDay() === 0 || result.getDay() === 6) {
      result.setDate(result.getDate() + 1);
    }
    
    // Set to end of business day (5 PM)
    result.setHours(17, 0, 0, 0);
    return result;
  }

  app.patch("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      // Get current patient state before update
      const currentPatient = await storage.getPatient(req.params.id);
      if (!currentPatient) return res.status(404).json({ error: "Patient not found" });
      
      const patient = await storage.updatePatient(req.params.id, req.body);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      
      // CAROLINE INSURANCE EXCEPTION: Auto-create insurance task when CDCP or work insurance is newly set
      const wasInsurance = currentPatient.isCDCP || currentPatient.workInsurance;
      const isInsurance = patient.isCDCP || patient.workInsurance;
      
      if (!wasInsurance && isInsurance) {
        const insuranceType = patient.isCDCP ? "CDCP" : "Work Insurance";
        await storage.createTask({
          title: `Submit ${insuranceType} estimate for ${patient.name}`,
          assignee: "Caroline",
          patientId: patient.id,
          dueDate: getNextBusinessDay(),
          priority: "high",
          status: "pending"
        });
      }
      
      res.json(patient);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clinical-notes/process", isAuthenticated, async (req: any, res) => {
    try {
      const { plainTextNote, patientId } = req.body;
      const patient = await storage.getPatient(patientId);
      if (!patient) return res.status(404).json({ error: "Patient not found" });

      const patientContext = {
        name: patient.name,
        isCDCP: patient.isCDCP,
        copayDiscussed: patient.copayDiscussed,
        currentToothShade: patient.currentToothShade,
        requestedToothShade: patient.requestedToothShade,
        upperDentureType: patient.upperDentureType,
        lowerDentureType: patient.lowerDentureType
      };

      const result = await processClinicalNote(plainTextNote, patientContext);
      const user = req.user as any;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

      const savedNote = await storage.createClinicalNote({
        patientId,
        appointmentId: null,
        content: result.formattedNote,
        createdBy: userName
      });

      // CLINICIAN-DRIVEN: AI suggestions are returned to frontend only
      // Tasks are NOT auto-created - clinician must approve each one
      // Exception: Caroline's insurance tasks for CDCP/work insurance (handled separately)

      res.json({ ...result, noteId: savedNote.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const { assignee, patientId } = req.query;
      const tasks = await storage.listTasks(assignee as string, patientId as string);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const task = await storage.updateTaskStatus(req.params.id, status);
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create task endpoint (for manual task creation by clinician)
  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const task = await storage.createTask(req.body);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Clinical notes listing
  app.get("/api/clinical-notes/:patientId", isAuthenticated, async (req, res) => {
    try {
      const notes = await storage.listClinicalNotes(req.params.patientId);
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Patient files
  app.get("/api/patients/:id/files", isAuthenticated, async (req, res) => {
    try {
      const files = await storage.listPatientFiles(req.params.id);
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/patients/:id/files", isAuthenticated, async (req, res) => {
    try {
      const { filename, fileUrl, fileType, description } = req.body;
      const file = await storage.createPatientFile({
        patientId: req.params.id,
        filename,
        fileUrl,
        fileType,
        description
      });
      res.json(file);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/patients/:id/files/:fileId", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deletePatientFile(req.params.fileId);
      if (!success) return res.status(404).json({ error: "File not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update patient photo
  app.patch("/api/patients/:id/photo", isAuthenticated, async (req, res) => {
    try {
      const { photoUrl } = req.body;
      const patient = await storage.updatePatient(req.params.id, { photoUrl });
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      res.json(patient);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Object storage upload URL generation
  const objectStorageService = new ObjectStorageService();
  
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const signedUrl = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL: signedUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Patient email notifications
  app.post("/api/patients/:id/notify", isAuthenticated, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      
      if (!patient.email) {
        return res.status(400).json({ error: "Patient has no email address" });
      }
      
      if (!patient.emailNotifications) {
        return res.status(400).json({ error: "Email notifications are disabled for this patient" });
      }
      
      const { subject, message } = req.body;
      if (!subject || !message) {
        return res.status(400).json({ error: "Subject and message are required" });
      }
      
      const success = await sendCustomNotification(patient.name, patient.email, subject, message);
      
      if (success) {
        res.json({ success: true, message: "Email sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle email notifications for a patient
  app.patch("/api/patients/:id/email-notifications", isAuthenticated, async (req, res) => {
    try {
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: "Invalid request: 'enabled' must be a boolean" });
      }
      
      const patient = await storage.getPatient(req.params.id);
      
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      
      if (enabled && !patient.email) {
        return res.status(400).json({ error: "Cannot enable notifications: patient has no email address" });
      }
      
      const updated = await storage.updatePatient(req.params.id, { emailNotifications: enabled });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== LAB NOTES =====
  // Get lab notes for a patient
  app.get("/api/lab-notes/:patientId", isAuthenticated, async (req, res) => {
    try {
      const notes = await storage.listLabNotes(req.params.patientId);
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create lab note
  app.post("/api/lab-notes", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertLabNoteSchema.parse(req.body);
      const user = req.user as any;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      
      const note = await storage.createLabNote({
        patientId: validatedData.patientId,
        content: validatedData.content,
        createdBy: userName
      });
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== ADMIN NOTES =====
  // Get admin notes for a patient
  app.get("/api/admin-notes/:patientId", isAuthenticated, async (req, res) => {
    try {
      const notes = await storage.listAdminNotes(req.params.patientId);
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create admin note
  app.post("/api/admin-notes", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertAdminNoteSchema.parse(req.body);
      const user = req.user as any;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      
      const note = await storage.createAdminNote({
        patientId: validatedData.patientId,
        content: validatedData.content,
        createdBy: userName
      });
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== LAB PRESCRIPTIONS =====
  // Get lab prescriptions for a patient
  app.get("/api/lab-prescriptions/:patientId", isAuthenticated, async (req, res) => {
    try {
      const prescriptions = await storage.listLabPrescriptions(req.params.patientId);
      res.json(prescriptions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single lab prescription
  app.get("/api/lab-prescription/:id", isAuthenticated, async (req, res) => {
    try {
      const prescription = await storage.getLabPrescription(req.params.id);
      if (!prescription) return res.status(404).json({ error: "Prescription not found" });
      res.json(prescription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create lab prescription
  app.post("/api/lab-prescriptions", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertLabPrescriptionSchema.parse(req.body);
      const user = req.user as any;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      
      const prescription = await storage.createLabPrescription({
        patientId: validatedData.patientId,
        labName: validatedData.labName,
        caseType: validatedData.caseType,
        arch: validatedData.arch,
        fabricationStage: validatedData.fabricationStage,
        deadline: validatedData.deadline,
        digitalFiles: validatedData.digitalFiles,
        designInstructions: validatedData.designInstructions,
        existingDentureReference: validatedData.existingDentureReference,
        biteNotes: validatedData.biteNotes,
        shippingInstructions: validatedData.shippingInstructions,
        specialNotes: validatedData.specialNotes,
        status: validatedData.status,
        createdBy: userName
      });
      res.json(prescription);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update lab prescription (mark as sent, update status, etc.)
  app.patch("/api/lab-prescriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      
      // If marking as sent, set the sentAt timestamp
      if (updates.status === "sent" && !updates.sentAt) {
        updates.sentAt = new Date();
      }
      
      const prescription = await storage.updateLabPrescription(req.params.id, updates);
      if (!prescription) return res.status(404).json({ error: "Prescription not found" });
      res.json(prescription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}