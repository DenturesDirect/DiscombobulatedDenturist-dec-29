import type { Express } from "express";
import { createServer, type Server } from "http";
import { processClinicalNote, generateReferralLetter } from "./openai";
// Force redeploy to pick up Supabase bucket name
import { storage } from "./storage";
import { insertPatientSchema, insertLabNoteSchema, insertAdminNoteSchema, insertLabPrescriptionSchema } from "@shared/schema";
import { setupLocalAuth, isAuthenticated, seedStaffAccounts } from "./localAuth";
import { seedTestData } from "./test-data";
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

  // Process clinical note with AI (does NOT save - gives clinician a chance to review/edit)
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
      
      // CLINICIAN-DRIVEN: Return formatted note for review - NOT saving yet
      // Clinician must explicitly approve and save after reviewing
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Save clinical note after clinician review/edit
  app.post("/api/clinical-notes/save", isAuthenticated, async (req: any, res) => {
    try {
      const { patientId, content, noteDate } = req.body;
      const patient = await storage.getPatient(patientId);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      
      const user = req.user as any;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      const parsedNoteDate = noteDate ? new Date(noteDate) : new Date();

      const savedNote = await storage.createClinicalNote({
        patientId,
        appointmentId: null,
        content,
        noteDate: parsedNoteDate,
        createdBy: userName
      });
      
      // CAROLINE INSURANCE EXCEPTION: Auto-create task if note mentions CDCP/insurance predetermination
      const lowerContent = content.toLowerCase();
      const mentionsCDCPTask = lowerContent.includes('cdcp') && 
        (lowerContent.includes('predetermination') || lowerContent.includes('insurance') || 
         lowerContent.includes('estimate') || lowerContent.includes('caroline'));
      
      if (mentionsCDCPTask || patient.isCDCP || patient.workInsurance) {
        // Check if a similar task already exists
        const existingTasks = await storage.listTasks('Caroline', patientId);
        const hasInsuranceTask = existingTasks.some(t => 
          t.title.toLowerCase().includes('insurance') || 
          t.title.toLowerCase().includes('cdcp') ||
          t.title.toLowerCase().includes('estimate')
        );
        
        if (!hasInsuranceTask) {
          const insuranceType = patient.isCDCP ? "CDCP" : "Insurance";
          await storage.createTask({
            title: `Submit ${insuranceType} estimate/predetermination for ${patient.name}`,
            assignee: "Caroline",
            patientId: patient.id,
            dueDate: getNextBusinessDay(),
            priority: "high",
            status: "pending"
          });
        }
      }

      res.json({ noteId: savedNote.id, note: savedNote });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Referral letter generation
  app.post("/api/referral-letters/generate", isAuthenticated, async (req, res) => {
    try {
      const { patientName, clinicalNote, dentistName } = req.body;
      
      if (!patientName || !clinicalNote) {
        return res.status(400).json({ error: "Patient name and clinical note are required" });
      }
      
      const letter = await generateReferralLetter(patientName, clinicalNote, dentistName);
      res.json({ letter });
    } catch (error: any) {
      console.error("Error generating referral letter:", error);
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
      // Convert dueDate from ISO string to Date if provided
      const taskData = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        patientId: req.body.patientId || null,
      };
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error: any) {
      console.error("❌ Error creating task:", error);
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
  // Use Supabase Storage if configured, otherwise fall back to Replit storage
  let objectStorageService: any;
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { SupabaseStorageService } = await import("./supabaseStorage");
      objectStorageService = new SupabaseStorageService();
      console.log("💾 Using Supabase Storage for file uploads");
    } else {
      objectStorageService = new ObjectStorageService();
      console.log("💾 Using Replit Object Storage (fallback - Supabase not configured)");
    }
  } catch (error: any) {
    console.warn("⚠️  Failed to initialize Supabase Storage, using fallback:", error.message);
    objectStorageService = new ObjectStorageService();
    console.log("💾 Using Replit Object Storage (fallback)");
  }
  
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const signedUrl = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL: signedUrl });
    } catch (error: any) {
      console.error("❌ Photo upload error:", error.message);
      
      // Check if Supabase is configured
      const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!hasSupabase) {
        res.status(500).json({ 
          error: "Photo upload is not configured. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Railway Variables. Photos are optional - you can continue without uploading photos."
        });
      } else {
        res.status(500).json({ 
          error: `Photo upload error: ${error.message}. Please check that the Supabase Storage bucket 'patient-files' exists and your service_role key has the correct permissions.`
        });
      }
    }
  });

  // Serve object storage files (for patient photos)
  // This route streams the file directly to the client for privacy
  app.get("/api/objects/*", isAuthenticated, async (req, res) => {
    try {
      const objectPath = `/objects/${req.params[0]}`;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      if (error.name === "ObjectNotFoundError") {
        return res.status(404).json({ error: "File not found" });
      }
      console.error("Error serving object:", error);
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
      console.log("Lab note request body:", JSON.stringify(req.body, null, 2));
      
      if (!req.body.patientId) {
        return res.status(400).json({ error: "Patient ID is required" });
      }
      if (!req.body.content || req.body.content.trim() === "") {
        return res.status(400).json({ error: "Lab note content cannot be empty" });
      }
      
      const dataToValidate = {
        patientId: String(req.body.patientId).trim(),
        content: String(req.body.content).trim()
      };
      
      console.log("Data to validate:", dataToValidate);
      
      const validatedData = insertLabNoteSchema.parse(dataToValidate);
      const user = req.user as any;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      
      console.log("Validated data:", validatedData);
      console.log("Created by:", userName);
      
      // Create the note with createdBy included
      const noteData = {
        patientId: validatedData.patientId,
        content: validatedData.content,
        createdBy: userName
      };
      
      console.log("Note data to insert:", noteData);
      
      const note = await storage.createLabNote(noteData as any);
      
      console.log("Lab note created successfully:", note.id);
      res.json(note);
    } catch (error: any) {
      console.error("Error creating lab note:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((e: any) => {
          return `${e.path.join('.')}: ${e.message}`;
        }).join(", ");
        return res.status(400).json({ error: `Validation error: ${errorMessages}` });
      }
      
      if (error.message) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(400).json({ error: "Failed to create lab note. Please check the server logs." });
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
      if (!req.body.patientId) {
        return res.status(400).json({ error: "Patient ID is required" });
      }
      if (!req.body.content || req.body.content.trim() === "") {
        return res.status(400).json({ error: "Admin note content cannot be empty" });
      }
      
      const validatedData = insertAdminNoteSchema.parse({
        patientId: String(req.body.patientId).trim(),
        content: String(req.body.content).trim()
      });
      const user = req.user as any;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      
      const note = await storage.createAdminNote({
        patientId: validatedData.patientId,
        content: validatedData.content,
        createdBy: userName
      } as any);
      res.json(note);
    } catch (error: any) {
      console.error("Error creating admin note:", error);
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((e: any) => {
          return `${e.path.join('.')}: ${e.message}`;
        }).join(", ");
        return res.status(400).json({ error: `Validation error: ${errorMessages}` });
      }
      res.status(400).json({ error: error.message || "Failed to create admin note" });
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
      // Validate required fields before schema validation
      if (!req.body.patientId) {
        return res.status(400).json({ error: "Patient ID is required" });
      }
      if (!req.body.labName || req.body.labName.trim() === "") {
        return res.status(400).json({ error: "Lab name is required" });
      }
      if (!req.body.caseType || req.body.caseType.trim() === "") {
        return res.status(400).json({ error: "Case type is required" });
      }
      if (!req.body.arch || req.body.arch.trim() === "") {
        return res.status(400).json({ error: "Arch (upper/lower/both) is required" });
      }
      if (!req.body.fabricationStage || req.body.fabricationStage.trim() === "") {
        return res.status(400).json({ error: "Fabrication stage is required" });
      }
      
      const validatedData = insertLabPrescriptionSchema.parse({
        ...req.body,
        labName: req.body.labName.trim(),
        caseType: req.body.caseType.trim(),
        arch: req.body.arch.trim(),
        fabricationStage: req.body.fabricationStage.trim(),
        status: req.body.status || "draft"
      });
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
        status: validatedData.status || "draft",
        createdBy: userName
      });
      res.json(prescription);
    } catch (error: any) {
      console.error("Error creating lab prescription:", error);
      if (error.errors) {
        return res.status(400).json({ error: `Validation error: ${error.errors.map((e: any) => e.message).join(", ")}` });
      }
      res.status(400).json({ error: error.message || "Failed to create lab prescription" });
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

  // Test data seeding endpoint (for development/testing)
  app.post("/api/test-data/seed", isAuthenticated, async (req, res) => {
    try {
      await seedTestData();
      res.json({ success: true, message: "Test data seeded successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}