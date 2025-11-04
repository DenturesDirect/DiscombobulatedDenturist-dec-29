import type { Express } from "express";
import { createServer, type Server } from "http";
import { processClinicalNote, generateReferralLetter } from "./openai";
import { storage } from "./storage";
import { insertPatientSchema, insertClinicalNoteSchema, insertTaskSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // PATIENTS
  app.post("/api/patients", async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.json(patient);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.listPatients();
      res.json(patients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
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

  app.patch("/api/patients/:id", async (req, res) => {
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

  // CLINICAL NOTES
  app.post("/api/clinical-notes/process", async (req, res) => {
    try {
      const { plainTextNote, patientId } = req.body;
      
      if (!plainTextNote || !patientId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      const result = await processClinicalNote(plainTextNote, patient.name);
      
      // Save the formatted note to database
      const savedNote = await storage.createClinicalNote({
        patientId,
        appointmentId: null,
        content: result.formattedNote,
        createdBy: "Damien"
      });

      // Save any suggested tasks
      if (result.suggestedTasks) {
        for (const task of result.suggestedTasks) {
          await storage.createTask({
            title: task.title,
            description: null,
            assignee: task.assignee,
            patientId,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            priority: task.priority,
            status: "pending"
          });
        }
      }

      res.json({ ...result, noteId: savedNote.id });
    } catch (error: any) {
      console.error("Error processing clinical note:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/clinical-notes/:patientId", async (req, res) => {
    try {
      const notes = await storage.listClinicalNotes(req.params.patientId);
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // TASKS
  app.get("/api/tasks", async (req, res) => {
    try {
      const { assignee } = req.query;
      const tasks = await storage.listTasks(assignee as string);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
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
