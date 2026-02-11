import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { processClinicalNote, generateReferralLetter, summarizePatientChart, analyzeRadiograph, formatDesignInstructions } from "./openai";
import { extractTextFromPDF } from "./pdfExtractor";
import { storage } from "./storage";
import { insertPatientSchema, insertLabNoteSchema, insertAdminNoteSchema, insertLabPrescriptionSchema, insertTaskSchema, insertPatientFileSchema } from "@shared/schema";
import { setupLocalAuth, isAuthenticated, seedStaffAccounts } from "./localAuth";
import { RailwayStorageService, getS3Client, ObjectNotFoundError } from "./railwayStorage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { sendCustomNotification, sendAppointmentReminder } from "./gmail";
import { getDbHostType } from "./config";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupLocalAuth(app);
  await seedStaffAccounts();

  // Health check endpoint (no auth required)
  app.get("/api/health", async (_req, res) => {
    try {
      const db = await import("./db").then(m => m.ensureDb());
      await db.execute({ sql: "SELECT 1", args: [] });
      
      const hasRailwayStorage = !!(
        process.env.RAILWAY_STORAGE_ACCESS_KEY_ID &&
        process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY &&
        process.env.RAILWAY_STORAGE_ENDPOINT
      );

      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
        databaseHostType: getDbHostType(),
        storage: {
          railway: hasRailwayStorage ? "configured" : "not_configured"
        }
      });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        error: error.message
      });
    }
  });

  app.post("/api/patients", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const user = req.user as any;
      const canViewAllOffices = user?.canViewAllOffices || false;
      
      // For multi-office users, officeId is required
      if (canViewAllOffices && !validatedData.officeId) {
        return res.status(400).json({ error: "Office selection is required. Please select an office before creating a patient." });
      }
      
      // Auto-assign officeId from user if not provided (for single-office users)
      if (!validatedData.officeId && user?.officeId) {
        validatedData.officeId = user.officeId;
      }
      
      // Ensure officeId is set before creating patient
      if (!validatedData.officeId) {
        return res.status(400).json({ error: "Office assignment is required. Patient must be assigned to an office." });
      }
      
      const patient = await storage.createPatient(validatedData);
      res.json(patient);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/patients", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const userOfficeId = user?.officeId || null;
      const canViewAllOffices = user?.canViewAllOffices || false;
      const selectedOfficeId = req.query.officeId || null;
      
      const patients = await storage.listPatients(userOfficeId, canViewAllOffices, selectedOfficeId);
      res.json(patients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/patients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const userOfficeId = user?.officeId || null;
      const canViewAllOffices = user?.canViewAllOffices || false;
      
      const patient = await storage.getPatient(req.params.id, userOfficeId, canViewAllOffices);
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

  app.patch("/api/patients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const userOfficeId = user?.officeId || null;
      const canViewAllOffices = user?.canViewAllOffices || false;
      
      // Get current patient state before update - check office permissions
      const currentPatient = await storage.getPatient(req.params.id, userOfficeId, canViewAllOffices);
      if (!currentPatient) return res.status(404).json({ error: "Patient not found" });
      
      // Validate and transform the request body, especially dates
      const validatedData = insertPatientSchema.partial().parse(req.body);
      
      // Ensure treatmentInitiationDate is properly converted to Date if it's a string
      if (validatedData.treatmentInitiationDate !== undefined) {
        if (typeof validatedData.treatmentInitiationDate === 'string' && validatedData.treatmentInitiationDate.trim().length > 0) {
          validatedData.treatmentInitiationDate = new Date(validatedData.treatmentInitiationDate);
        } else if (!validatedData.treatmentInitiationDate) {
          validatedData.treatmentInitiationDate = null;
        }
      }
      
      // Ensure lastStepDate is properly converted to Date if it's a string
      if (validatedData.lastStepDate !== undefined) {
        if (typeof validatedData.lastStepDate === 'string' && validatedData.lastStepDate.trim().length > 0) {
          validatedData.lastStepDate = new Date(validatedData.lastStepDate);
        } else if (!validatedData.lastStepDate) {
          validatedData.lastStepDate = null;
        }
      }
      
      const patient = await storage.updatePatient(req.params.id, validatedData);
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

  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { status, notes, completedBy } = req.body;
      
      // If only status is being updated, use the existing method for backward compatibility
      if (status !== undefined && notes === undefined) {
        const task = await storage.updateTaskStatus(req.params.id, status, completedBy);
        return res.json(task);
      }
      
      // Otherwise, use the new updateTask method that supports notes
      const updates: Partial<{ status: string; notes: string; completedBy?: string }> = {};
      if (status !== undefined) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      if (completedBy !== undefined) updates.completedBy = completedBy;
      
      const task = await storage.updateTask(req.params.id, updates);
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create task endpoint (for manual task creation by clinician)
  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      // Validate and transform the request body (dueDate is now transformed in schema)
      const validatedData = insertTaskSchema.parse(req.body);
      
      // Ensure priority is valid
      if (validatedData.priority && !['high', 'normal', 'low'].includes(validatedData.priority)) {
        validatedData.priority = 'normal';
      }
      
      // Get user context for office assignment
      const user = req.user as any;
      const userOfficeId = user?.officeId || null;
      
      // If officeId not provided and task is patient-related, get it from patient
      if (!validatedData.officeId && validatedData.patientId) {
        const patient = await storage.getPatient(validatedData.patientId, userOfficeId, user?.canViewAllOffices || false);
        if (patient) {
          validatedData.officeId = patient.officeId;
        } else if (userOfficeId) {
          validatedData.officeId = userOfficeId;
        }
      } else if (!validatedData.officeId && userOfficeId) {
        validatedData.officeId = userOfficeId;
      }
      
      const task = await storage.createTask(validatedData);
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
  app.get("/api/patients/:id/files", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const userOfficeId = user?.officeId || null;
      const canViewAllOffices = user?.canViewAllOffices || false;
      const files = await storage.listPatientFiles(req.params.id, userOfficeId, canViewAllOffices);
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/patients/:id/files", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const userOfficeId = user?.officeId || null;
      const canViewAllOffices = user?.canViewAllOffices || false;
      
      // Verify user can access this patient
      const patient = await storage.getPatient(req.params.id, userOfficeId, canViewAllOffices);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      
      // Validate request body
      const validatedData = insertPatientFileSchema.parse({
        patientId: req.params.id,
        filename: req.body.filename,
        fileUrl: req.body.fileUrl,
        fileType: req.body.fileType,
        description: req.body.description
      });
      
      // OfficeId will be auto-assigned from patient in storage.createPatientFile
      const file = await storage.createPatientFile(validatedData);
      res.json(file);
    } catch (error: any) {
      console.error("Error creating patient file:", error);
      res.status(400).json({ error: error.message || "Failed to create patient file" });
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

  // Chart upload endpoint for PDF processing
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    }
  });

  app.post("/api/patients/:id/chart-upload", isAuthenticated, upload.single('chart'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Verify file is PDF
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: "Only PDF files are allowed" });
      }

      // Get patient information
      const user = req.user as any;
      const userOfficeId = user?.officeId || null;
      const canViewAllOffices = user?.canViewAllOffices || false;
      const patient = await storage.getPatient(req.params.id, userOfficeId, canViewAllOffices);
      
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      // Get patient name for summary
      const patientName = patient.firstName && patient.lastName 
        ? `${patient.firstName} ${patient.lastName}`
        : patient.firstName || patient.lastName || "Patient";

      // Extract text from PDF
      const chartText = await extractTextFromPDF(req.file.buffer);
      
      if (!chartText || chartText.trim().length === 0) {
        return res.status(400).json({ error: "Could not extract text from PDF. The file may be corrupted or contain only images." });
      }

      // Summarize the chart using OpenAI
      const summaryResult = await summarizePatientChart(chartText, patientName);

      // Return the formatted note
      res.json({ 
        summary: summaryResult.formattedNote,
        followUpPrompt: summaryResult.followUpPrompt || null,
        suggestedTasks: summaryResult.suggestedTasks || null
      });
    } catch (error: any) {
      console.error("Chart upload error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to process chart. Please try again." 
      });
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

  // Object storage - Railway-only (no Supabase for uploads)
  function getStorageService(): RailwayStorageService {
    const railwayAccessKey = process.env.RAILWAY_STORAGE_ACCESS_KEY_ID;
    const railwaySecretKey = process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY;
    const railwayEndpoint = process.env.RAILWAY_STORAGE_ENDPOINT;

    if (railwayAccessKey && railwaySecretKey && railwayEndpoint) {
      try {
        return new RailwayStorageService();
      } catch (error: any) {
        console.warn("⚠️  Railway Storage init failed:", error.message);
      }
    }

    console.error("❌ Railway Storage not configured. Set RAILWAY_STORAGE_ACCESS_KEY_ID, RAILWAY_STORAGE_SECRET_ACCESS_KEY, RAILWAY_STORAGE_ENDPOINT.");
    throw new Error(
      "Storage not configured. Set up Railway Storage Buckets: RAILWAY_STORAGE_ACCESS_KEY_ID, RAILWAY_STORAGE_SECRET_ACCESS_KEY, RAILWAY_STORAGE_ENDPOINT."
    );
  }

  
  // Diagnostic endpoint to check storage configuration
  app.get("/api/storage/status", isAuthenticated, async (req: any, res) => {
    try {
      const railwayAccessKey = !!process.env.RAILWAY_STORAGE_ACCESS_KEY_ID;
      const railwaySecretKey = !!process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY;
      const railwayEndpoint = !!process.env.RAILWAY_STORAGE_ENDPOINT;
      const railwayBucket = process.env.RAILWAY_STORAGE_BUCKET_NAME || "patient-files";
      
      const railwayConfigured = railwayAccessKey && railwaySecretKey && railwayEndpoint;
      
      // Try to initialize storage service (Railway only)
      let storageWorking = false;
      let storageError: string | null = null;
      try {
        const storageService = getStorageService();
        await storageService.getObjectEntityUploadURL();
        storageWorking = true;
      } catch (error: any) {
        storageError = error.message;
      }

      res.json({
        railway: {
          configured: railwayConfigured,
          accessKeySet: railwayAccessKey,
          secretKeySet: railwaySecretKey,
          endpointSet: railwayEndpoint,
          bucketName: railwayBucket,
        },
        supabase: { configured: false, note: "Railway-only deployment" },
        storageWorking,
        storageError,
        activeStorage: railwayConfigured ? "railway" : "none",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req: any, res) => {
    const user = req.user as any;
    console.log(`📤 Upload request from user: ${user?.email || 'unknown'} (role: ${user?.role || 'unknown'}, id: ${user?.id || 'unknown'})`);
    
    try {
      const storageService = getStorageService();
      console.log(`✅ Storage service initialized successfully (Railway)`);
      
      const uploadInfo = await storageService.getObjectEntityUploadURL();
      console.log(`✅ Upload URL generated successfully`);
      console.log(`   Object path: ${uploadInfo.objectPath}`);
      console.log(`   URL length: ${uploadInfo.uploadURL.length} characters`);
      console.log(`   URL preview: ${uploadInfo.uploadURL.substring(0, 80)}...`);
      
      res.json({ 
        uploadURL: uploadInfo.uploadURL,
        objectPath: uploadInfo.objectPath 
      });
    } catch (error: any) {
      console.error(`❌ Upload URL generation failed:`);
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error name: ${error.name}`);
      console.error(`   Error code: ${error.code || 'N/A'}`);
      if (error.stack) {
        console.error(`   Error stack:`, error.stack);
      }
      
      // Check for specific Railway Storage errors
      if (error.message?.includes("NoSuchBucket") || error.code === "NoSuchBucket") {
        console.error(`   ⚠️  Bucket does not exist or name is incorrect`);
        console.error(`   Check RAILWAY_STORAGE_BUCKET_NAME environment variable`);
      }
      if (error.message?.includes("InvalidAccessKeyId") || error.code === "InvalidAccessKeyId") {
        console.error(`   ⚠️  Invalid access key`);
        console.error(`   Check RAILWAY_STORAGE_ACCESS_KEY_ID environment variable`);
      }
      if (error.message?.includes("SignatureDoesNotMatch") || error.code === "SignatureDoesNotMatch") {
        console.error(`   ⚠️  Invalid secret key`);
        console.error(`   Check RAILWAY_STORAGE_SECRET_ACCESS_KEY environment variable`);
      }
      
      // Provide user-friendly error messages
      let userMessage = error.message;
      if (error.message?.includes("Storage not configured")) {
        userMessage = "File storage is not configured. Please contact your administrator.";
      } else if (error.message?.includes("Railway Storage not configured") || error.message?.includes("Supabase Storage not configured")) {
        userMessage = "File storage is not configured. Please contact your administrator.";
      } else if (error.message?.includes("NoSuchBucket") || error.code === "NoSuchBucket") {
        userMessage = "Storage bucket not found. Please check bucket configuration.";
      } else if (error.message?.includes("InvalidAccessKeyId") || error.code === "InvalidAccessKeyId") {
        userMessage = "Invalid storage credentials. Please check configuration.";
      }
      
      res.status(500).json({ error: userMessage });
    }
  });

  // Analyze radiograph/CBCT scan endpoint
  app.post("/api/analyze-radiograph", isAuthenticated, async (req: any, res) => {
    try {
      const { imageUrl, imageType } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      // Validate imageType
      const validImageType = imageType === "cbct" ? "cbct" : "radiograph";
      
      // If the URL is a relative path (our API endpoint), fetch the image and convert to base64
      let finalImageUrl = imageUrl;
      
      if (imageUrl.startsWith('/api/objects/')) {
        // Extract the path and fetch the image from object storage
        const pathAfterApi = imageUrl.replace(/^\/api\/objects\/?/, '');
        const storagePath = `/objects/${pathAfterApi}`;
        
        try {
          const storageService = getStorageService();
          const fileInfo = await storageService.getObjectEntityFile(storagePath);
          const s3 = getS3Client();
          const command = new GetObjectCommand({
            Bucket: fileInfo.bucket,
            Key: fileInfo.path,
          });
          const response = await s3.send(command);
          if (!response.Body) throw new Error("Failed to download file from Railway Storage");
          const chunks: Uint8Array[] = [];
          for await (const chunk of response.Body as any) chunks.push(chunk);
          const buffer = Buffer.concat(chunks);
          finalImageUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        } catch (error: any) {
          console.error("Error fetching image from storage:", error);
          return res.status(404).json({ error: "Image not found in storage" });
        }
      } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        // If it's a relative path, try to construct full URL
        const protocol = req.protocol;
        const host = req.get('host');
        finalImageUrl = `${protocol}://${host}${imageUrl}`;
      }
      
      // Analyze the image
      const interpretation = await analyzeRadiograph(finalImageUrl, validImageType);

      res.json({ 
        interpretation,
        imageType: validImageType
      });
    } catch (error: any) {
      console.error("Radiograph analysis error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to analyze image. Please try again." 
      });
    }
  });

  // Serve object storage files (for patient photos)
  // This route streams the file directly to the client for privacy
  app.get("/api/objects/*", isAuthenticated, async (req, res) => {
    try {
      // Extract the path after /api/objects/
      // req.path gives us the full path like "/api/objects/uploads/uuid/filename.jpg"
      // We need to extract "uploads/uuid/filename.jpg" and prepend "/objects/"
      const fullPath = req.path; // e.g., "/api/objects/uploads/uuid/filename.jpg"
      const pathAfterApi = fullPath.replace(/^\/api\/objects\/?/, ''); // Remove "/api/objects/" prefix
      
      // The storage service expects paths starting with "/objects/"
      const storagePath = `/objects/${pathAfterApi}`;
      
      // Railway-only: single source for object storage
      const railwayAccessKey = process.env.RAILWAY_STORAGE_ACCESS_KEY_ID;
      const railwaySecretKey = process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY;
      const railwayEndpoint = process.env.RAILWAY_STORAGE_ENDPOINT;

      if (railwayAccessKey && railwaySecretKey && railwayEndpoint) {
        try {
          const railwayService = new RailwayStorageService();
          const fileInfo = await railwayService.getObjectEntityFile(storagePath);
          await railwayService.downloadObject(fileInfo, res);
          if (res.headersSent) return;
        } catch (railwayError: any) {
          if (!res.headersSent) {
            console.log("📁 File not found in Railway Storage");
          }
        }
      }

      // File not found in storage
      if (!res.headersSent) {
        throw new ObjectNotFoundError();
      }
    } catch (error: any) {
      if (error.name === "ObjectNotFoundError" || error.message?.includes("not found")) {
        return res.status(404).json({ error: "File not found" });
      }
      console.error("Error serving object:", error);
      res.status(500).json({ error: error.message || "Failed to serve file" });
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
  // Format lab prescription design instructions
  app.post("/api/lab-prescriptions/format-instructions", isAuthenticated, async (req: any, res) => {
    try {
      const { designInstructions } = req.body;

      if (!designInstructions || typeof designInstructions !== 'string') {
        return res.status(400).json({ error: "Design instructions text is required" });
      }

      if (!designInstructions.trim()) {
        return res.status(400).json({ error: "Design instructions cannot be empty" });
      }

      const formatted = await formatDesignInstructions(designInstructions);
      res.json({ formattedInstructions: formatted });
    } catch (error: any) {
      console.error("Error formatting design instructions:", error);
      res.status(500).json({ 
        error: error.message || "Failed to format design instructions. Please try again." 
      });
    }
  });

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
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User';
      
      const prescription = await storage.createLabPrescription({
        patientId: validatedData.patientId,
        labName: validatedData.labName,
        caseType: validatedData.caseType,
        caseTypeUpper: validatedData.caseTypeUpper,
        caseTypeLower: validatedData.caseTypeLower,
        arch: validatedData.arch,
        fabricationStage: validatedData.fabricationStage,
        fabricationStageUpper: validatedData.fabricationStageUpper,
        fabricationStageLower: validatedData.fabricationStageLower,
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

  // Get all offices
  app.get("/api/offices", isAuthenticated, async (req, res) => {
    try {
      const offices = await storage.listOffices();
      res.json(offices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Serve fix-office HTML page (must be before catch-all routes)
  app.get("/fix-office", (req, res) => {
    const path = require("path");
    const filePath = path.join(process.cwd(), "fix-office.html");
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error serving fix-office.html:", err);
        res.status(404).send(`Fix office page not found: ${err.message}`);
      }
    });
  });

  // Serve fix-office HTML page
  app.get("/fix-office", (req, res) => {
    res.sendFile("fix-office.html", { root: process.cwd() }, (err) => {
      if (err) {
        res.status(404).send("Fix office page not found. Make sure fix-office.html is in the project root.");
      }
    });
  });

  // Diagnostic endpoint for office scope issues
  app.get("/api/debug/office-scope", isAuthenticated, async (req: any, res) => {
    try {
      const { ensureDb } = await import("./db");
      const { patients, users, offices } = await import("@shared/schema");
      const { sql } = await import("drizzle-orm");
      const db = ensureDb();
      const currentUser = req.user as any;

      // Get all offices
      const allOffices = await db.select().from(offices);
      
      // Get patient distribution by office
      const patientDist = await db.execute(sql`
        SELECT office_id, COUNT(*) as count 
        FROM patients 
        GROUP BY office_id 
        ORDER BY count DESC
      `);

      // Get user distribution by office
      const userDist = await db.execute(sql`
        SELECT office_id, COUNT(*) as count,
               STRING_AGG(username, ', ') as usernames
        FROM users 
        GROUP BY office_id 
        ORDER BY count DESC
      `);

      // Get current user info
      const currentUserInfo = await db.select().from(users).where(sql`id = ${currentUser.id}`);

      res.json({
        currentUser: {
          id: currentUser.id,
          username: currentUser.username,
          officeId: currentUser.officeId,
          canViewAllOffices: currentUser.canViewAllOffices,
        },
        offices: allOffices.map(o => ({ id: o.id, name: o.name })),
        patientDistribution: patientDist.rows.map((row: any) => ({
          officeId: row.office_id || "NULL",
          officeName: allOffices.find((o) => o.id === row.office_id)?.name || "No office",
          patientCount: parseInt(row.count),
        })),
        userDistribution: userDist.rows.map((row: any) => ({
          officeId: row.office_id || "NULL",
          officeName: allOffices.find((o) => o.id === row.office_id)?.name || "No office",
          userCount: parseInt(row.count),
          usernames: row.usernames,
        })),
        totalPatients: patientDist.rows.reduce((sum: number, row: any) => sum + parseInt(row.count), 0),
        diagnosis: {
          userOfficeId: currentUser.officeId,
          patientsInUserOffice: patientDist.rows.find((r: any) => r.office_id === currentUser.officeId)?.count || 0,
          recommendation: currentUser.officeId 
            ? `Your office (${currentUser.officeId}) has ${patientDist.rows.find((r: any) => r.office_id === currentUser.officeId)?.count || 0} patients. Most patients are in office: ${patientDist.rows[0]?.office_id || "unknown"}.`
            : "You don't have an office assigned. You need to be assigned to an office that has patients.",
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Fix office assignment endpoint - automatically assigns user to office with most patients
  app.post("/api/debug/fix-office", isAuthenticated, async (req: any, res) => {
    try {
      const { ensureDb } = await import("./db");
      const { users, patients, offices } = await import("@shared/schema");
      const { sql, eq } = await import("drizzle-orm");
      const db = ensureDb();
      const currentUser = req.user as any;

      // Get patient distribution by office
      const patientDist = await db.execute(sql`
        SELECT office_id, COUNT(*) as count 
        FROM patients 
        WHERE office_id IS NOT NULL
        GROUP BY office_id 
        ORDER BY count DESC
        LIMIT 1
      `);

      if (patientDist.rows.length === 0) {
        return res.status(400).json({ error: "No patients found with office assignments" });
      }

      const targetOfficeId = patientDist.rows[0].office_id;
      const patientCount = parseInt(patientDist.rows[0].count);

      // Get office name
      const targetOffice = await db.select().from(offices).where(eq(offices.id, targetOfficeId));
      const officeName = targetOffice[0]?.name || "Unknown";

      // Update user's office
      const updatedUsers = await db.update(users)
        .set({ officeId: targetOfficeId })
        .where(eq(users.id, currentUser.id))
        .returning();

      if (updatedUsers.length === 0) {
        return res.status(500).json({ error: "Failed to update user" });
      }

      res.json({
        success: true,
        message: `Your office has been updated to ${officeName}`,
        user: {
          username: updatedUsers[0].username,
          officeId: updatedUsers[0].officeId,
          officeName: officeName,
        },
        patientsInOffice: patientCount,
        nextSteps: [
          "Log out and log back in",
          `You should now see ${patientCount} patients`,
        ],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Diagnostic endpoint for upload issues
  app.get("/api/debug/upload-status", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const dbUser = await storage.getUser(user.id);
      
      // Check storage configuration
      const hasRailwayStorage = !!(
        process.env.RAILWAY_STORAGE_ACCESS_KEY_ID &&
        process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY &&
        process.env.RAILWAY_STORAGE_ENDPOINT
      );
      
      // Try to initialize storage service (Railway only)
      let storageServiceStatus = "unknown";
      let storageError: string | null = null;
      try {
        const storageService = getStorageService();
        storageServiceStatus = "railway";
      } catch (error: any) {
        storageServiceStatus = "error";
        storageError = error.message;
      }
      
      // Redacted env snapshot for rollback documentation (no secrets)
      const envSnapshot: Record<string, string> = {};
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
        try {
          const u = new URL(dbUrl.replace(/^postgresql:/, "https:"));
          envSnapshot.DATABASE_URL = `***@${u.hostname}${u.pathname}`;
        } catch {
          envSnapshot.DATABASE_URL = "(set)";
        }
      } else {
        envSnapshot.DATABASE_URL = "(not set)";
      }
      envSnapshot.RAILWAY_STORAGE = hasRailwayStorage ? "configured" : "not_configured";

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          officeId: dbUser?.officeId || null,
          canViewAllOffices: dbUser?.canViewAllOffices || false,
        },
        authentication: {
          isAuthenticated: req.isAuthenticated(),
          sessionId: req.sessionID,
        },
        storage: {
          railway: {
            configured: hasRailwayStorage,
            accessKeyId: !!process.env.RAILWAY_STORAGE_ACCESS_KEY_ID,
            secretAccessKey: !!process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY,
            endpoint: !!process.env.RAILWAY_STORAGE_ENDPOINT,
          },
          supabase: { configured: false, note: "Railway-only deployment" },
          serviceStatus: storageServiceStatus,
          error: storageError,
        },
        envSnapshot,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}