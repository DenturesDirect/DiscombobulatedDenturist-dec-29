import type { Express } from "express";
import { createServer, type Server } from "http";
import { processClinicalNote, generateReferralLetter } from "./openai";
import { storage } from "./storage";
import { insertPatientSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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

  app.patch("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const patient = await storage.updatePatient(req.params.id, req.body);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
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
      const userName = `${req.user.claims.first_name || ''} ${req.user.claims.last_name || ''}`.trim();

      const savedNote = await storage.createClinicalNote({
        patientId,
        appointmentId: null,
        content: result.formattedNote,
        createdBy: userName
      });

      // FIX: Linked task save logic
      if (result.suggestedTasks && result.suggestedTasks.length > 0) {
        for (const suggested of result.suggestedTasks) {
          await storage.createTask({
            title: suggested.title,
            assignee: suggested.assignee,
            patientId: patientId, // Bind task to patient
            dueDate: new Date(suggested.dueDate),
            priority: suggested.priority || "normal",
            status: "pending"
          });
        }
      }

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

  const httpServer = createServer(app);
  return httpServer;
}