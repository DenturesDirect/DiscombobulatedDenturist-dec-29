import type { Express } from "express";
import { createServer, type Server } from "http";
import { processClinicalNote, generateReferralLetter } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Process plain English clinical note into formal format with AI
  app.post("/api/clinical-notes/process", async (req, res) => {
    try {
      const { plainTextNote, patientName } = req.body;
      
      if (!plainTextNote || !patientName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await processClinicalNote(plainTextNote, patientName);
      res.json(result);
    } catch (error: any) {
      console.error("Error processing clinical note:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate referral letter based on clinical notes
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
