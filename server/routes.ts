import type { Express } from "express";
import { createServer, type Server } from "http";
import { processClinicalNote, generateReferralLetter } from "./openai";
import { storage } from "./storage";
import { insertPatientSchema, insertClinicalNoteSchema, insertTaskSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth route
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // PATIENTS (Protected)
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
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const patient = await storage.updatePatient(req.params.id, req.body);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // OBJECT STORAGE - Patient Photos (Protected)
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.patch("/api/patients/:id/photo", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.body.photoUrl) {
        return res.status(400).json({ error: "photoUrl is required" });
      }

      const userId = req.user.claims.sub;
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.photoUrl,
        {
          owner: userId,
          visibility: "public",
        },
      );

      const patient = await storage.updatePatient(req.params.id, { 
        photoUrl: objectPath 
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      res.json(patient);
    } catch (error: any) {
      console.error("Error updating patient photo:", error);
      res.status(500).json({ error: "Failed to update patient photo" });
    }
  });

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // CLINICAL NOTES (Protected)
  app.post("/api/clinical-notes/process", isAuthenticated, async (req: any, res) => {
    try {
      const { plainTextNote, patientId } = req.body;
      
      if (!plainTextNote || !patientId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      // Pass patient shade information to AI
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
      
      // Save the formatted note to database with authenticated user
      const userName = `${req.user.claims.first_name || ''} ${req.user.claims.last_name || ''}`.trim() || req.user.claims.email || 'Unknown';
      const savedNote = await storage.createClinicalNote({
        patientId,
        appointmentId: null,
        content: result.formattedNote,
        createdBy: userName
      });

      // Note: Tasks are NO LONGER auto-created. The clinician controls all workflow decisions.
      // The AI only formats notes and provides gentle suggestions via followUpPrompt.

      res.json({ ...result, noteId: savedNote.id });
    } catch (error: any) {
      console.error("Error processing clinical note:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/clinical-notes/:patientId", isAuthenticated, async (req, res) => {
    try {
      const notes = await storage.listClinicalNotes(req.params.patientId);
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // TASKS (Protected)
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
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PATIENT FILES (Protected)
  app.get("/api/patients/:patientId/files", isAuthenticated, async (req, res) => {
    try {
      const files = await storage.listPatientFiles(req.params.patientId);
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/patients/:patientId/files", isAuthenticated, async (req, res) => {
    try {
      const { filename, fileUrl, fileType, description } = req.body;
      
      if (!filename || !fileUrl) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const file = await storage.createPatientFile({
        patientId: req.params.patientId,
        filename,
        fileUrl,
        fileType: fileType || undefined,
        description: description || undefined
      });
      
      res.json(file);
    } catch (error: any) {
      console.error("Error creating patient file:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/patients/:patientId/files/:fileId", isAuthenticated, async (req, res) => {
    try {
      const files = await storage.listPatientFiles(req.params.patientId);
      const fileToDelete = files.find(f => f.id === req.params.fileId);
      
      if (!fileToDelete) {
        return res.status(404).json({ error: "File not found or does not belong to this patient" });
      }
      
      const deleted = await storage.deletePatientFile(req.params.fileId);
      if (!deleted) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting patient file:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // REFERRAL LETTERS
  app.post("/api/referral-letters/generate", async (req, res) => {
    try {
      const { patientName, clinicalNote, dentistName } = req.body;
      
      if (!patientName || !clinicalNote) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const letter = await generateReferralLetter(patientName, clinicalNote, dentistName);
      res.json({ letter });
    } catch (error: any) {
      console.error("Error generating referral letter:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
