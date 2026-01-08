import type { Express, Response, Request } from "express";
import { createServer, type Server } from "http";
import { processClinicalNote, generateReferralLetter, summarizePatientChart } from "./openai";
// Force redeploy to pick up Supabase bucket name
import { storage } from "./storage";
import { insertPatientSchema, insertLabNoteSchema, insertAdminNoteSchema, insertLabPrescriptionSchema } from "@shared/schema";
import { setupLocalAuth, isAuthenticated, isAdmin, seedStaffAccounts } from "./localAuth";
import { seedTestData } from "./test-data";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { sendCustomNotification, sendAppointmentReminder } from "./gmail";
import { sendPatientNotification } from "./notifications";
import multer from "multer";
import { extractTextFromPDF } from "./pdfExtractor";

// Helper function to get user office context from request
async function getUserOfficeContext(req: any): Promise<{ officeId: string | null; canViewAllOffices: boolean }> {
  const user = req.user as any;
  if (!user?.id) {
    return { officeId: null, canViewAllOffices: false };
  }
  
  const dbUser = await storage.getUser(user.id);
  if (!dbUser) {
    return { officeId: null, canViewAllOffices: false };
  }
  
  // Check if user is from Dentures Direct (all Dentures Direct staff can see all data)
  const email = dbUser.email?.toLowerCase() || '';
  const isDenturesDirectUser = email.includes('denturesdirect');
  
  // Dentures Direct staff can see all offices, Toronto Smile Centre staff can only see their own
  const canViewAll = (dbUser.canViewAllOffices ?? false) || isDenturesDirectUser;
  
  return {
    officeId: dbUser.officeId ?? null,
    canViewAllOffices: canViewAll
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupLocalAuth(app);
  await seedStaffAccounts();

  // Get offices list
  app.get("/api/offices", isAuthenticated, async (req, res) => {
    try {
      const { offices } = await import("@shared/schema");
      const { ensureDb } = await import("./db");
      const db = ensureDb();
      if (!db) {
        return res.json([]); // Return empty if no database
      }
      const officesList = await db.select().from(offices);
      // Sort by name manually since drizzle orderBy with text fields can be tricky
      officesList.sort((a, b) => a.name.localeCompare(b.name));
      res.json(officesList);
    } catch (error: any) {
      console.error("Error fetching offices:", error);
      res.json([]); // Return empty array on error
    }
  });

  app.post("/api/patients", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const validatedData = insertPatientSchema.parse(req.body);
      
      // Ensure officeId is always set (required in database)
      // If user cannot view all offices, force officeId to their office
      if (!officeContext.canViewAllOffices && officeContext.officeId) {
        validatedData.officeId = officeContext.officeId;
      }
      // If user can view all offices but didn't specify officeId, use their default office
      else if (!validatedData.officeId && officeContext.officeId) {
        validatedData.officeId = officeContext.officeId;
      }
      
      // Final check: officeId must be set (required in database)
      if (!validatedData.officeId) {
        return res.status(400).json({ error: "Office ID is required. Please select an office." });
      }
      
      const patient = await storage.createPatient(validatedData);
      res.json(patient);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/patients", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const selectedOfficeId = req.query.officeId as string | undefined;
      const patients = await storage.listPatients(
        officeContext.officeId,
        officeContext.canViewAllOffices,
        selectedOfficeId || null
      );
      res.json(patients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const patient = await storage.getPatient(
        req.params.id,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
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
      const officeContext = await getUserOfficeContext(req);
      
      // Get current patient state before update (with office check)
      const currentPatient = await storage.getPatient(
        req.params.id,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      if (!currentPatient) return res.status(404).json({ error: "Patient not found" });
      
      // If user cannot view all offices, prevent changing officeId
      if (!officeContext.canViewAllOffices && req.body.officeId) {
        delete req.body.officeId; // Remove officeId from update if user can't change it
      }
      
      // If lastStepCompleted is being updated, automatically set lastStepDate to today
      if (req.body.lastStepCompleted !== undefined && req.body.lastStepCompleted !== currentPatient.lastStepCompleted) {
        req.body.lastStepDate = new Date();
      }
      
      const patient = await storage.updatePatient(req.params.id, req.body);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      
      // AUTO-CREATE PREDETERMINATION TASK: When status is set to "pending", create task for appropriate staff
      const wasPending = currentPatient.predeterminationStatus === "pending";
      const isPending = patient.predeterminationStatus === "pending";
      
      if (!wasPending && isPending) {
        try {
          // Get patient's office name to determine correct assignee
          let patientOfficeName: string | null = null;
          if (patient.officeId) {
            const { offices } = await import("@shared/schema");
            const { ensureDb } = await import("./db");
            const db = ensureDb();
            if (db) {
              const { eq } = await import("drizzle-orm");
              const officeList = await db.select().from(offices).where(eq(offices.id, patient.officeId)).limit(1);
              if (officeList.length > 0) {
                patientOfficeName = officeList[0].name;
              }
            }
          }
          
          // Determine assignee based on office
          let assignee = "Caroline"; // Default to Caroline
          if (patientOfficeName === "Toronto Smile Centre") {
            assignee = "Admin";
          }
          
          // Check if a similar predetermination task already exists
          const existingTasks = await storage.listTasks(
            assignee,
            patient.id,
            officeContext.officeId,
            officeContext.canViewAllOffices
          );
          const hasPredeterminationTask = existingTasks.some(t => {
            const titleLower = (t.title || '').toLowerCase();
            return titleLower.includes("pre-d") || 
                   titleLower.includes("predetermination") || 
                   titleLower.includes("pre determination") ||
                   titleLower.includes("pre-d estimate") ||
                   titleLower.includes("predetermination estimate");
          });
          
          if (!hasPredeterminationTask) {
            const insuranceType = patient.isCDCP ? "CDCP" : (patient.workInsurance ? "Insurance" : "Insurance");
            const createdTask = await storage.createTask({
              title: `Submit ${insuranceType} predetermination for ${patient.name}`,
              assignee: assignee,
              patientId: patient.id,
              dueDate: getNextBusinessDay(),
              priority: "high",
              status: "pending"
            });
            console.log(`✅ Auto-created predetermination task for ${patient.name} assigned to ${assignee}`);
          }
        } catch (error: any) {
          console.error("⚠️  Failed to auto-create predetermination task:", error.message);
          // Don't fail the request if task creation fails
        }
      }
      
      // Send notification when CDCP estimate is set (but don't auto-create tasks)
      if (patient.isCDCP) {
        const wasCDCP = currentPatient.isCDCP;
        if (!wasCDCP && patient.isCDCP) {
          try {
            await sendPatientNotification(patient.id, "cdcp_estimate_set");
          } catch (error: any) {
            console.error("❌ Failed to send CDCP notification:", error);
            // Don't fail the request if notification fails
          }
        }
      }
      
      // Check for bite blocks complete
      const lastStepLower = patient.lastStepCompleted?.toLowerCase() || "";
      const nextStepLower = patient.nextStep?.toLowerCase() || "";
      const wasBiteBlocks = (currentPatient.lastStepCompleted?.toLowerCase() || "").includes("bite block");
      const isBiteBlocks = lastStepLower.includes("bite block") || nextStepLower.includes("bite block");
      
      if (!wasBiteBlocks && isBiteBlocks && (lastStepLower.includes("complete") || lastStepLower.includes("done") || lastStepLower.includes("finished"))) {
        try {
          await sendPatientNotification(patient.id, "bite_blocks_complete");
        } catch (error: any) {
          console.error("❌ Failed to send bite blocks notification:", error);
          // Don't fail the request if notification fails
        }
      }
      
      res.json(patient);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Process clinical note with AI (does NOT save - gives clinician a chance to review/edit)
  app.post("/api/clinical-notes/process", isAuthenticated, async (req: any, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const { plainTextNote, patientId } = req.body;
      const patient = await storage.getPatient(
        patientId,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
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
  
  // Upload and summarize patient chart PDF (Dentures Direct only)
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

  // Error handler for multer errors
  const handleMulterError = (err: any, req: Request, res: Response, next: any) => {
    if (err) {
      console.error("❌ Multer error:", err);
      console.error("❌ Multer error message:", err.message);
      console.error("❌ Multer error code:", err.code);
      return res.status(400).json({ 
        error: `File Upload Error: ${err.message || "Failed to upload file. Please ensure you're uploading a PDF file under 10MB."}` 
      });
    }
    next();
  };

  app.post("/api/patients/:id/chart-upload", isAuthenticated, upload.single('chart'), handleMulterError, async (req: any, res: Response) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      
      // Verify user can access this patient
      const patient = await storage.getPatient(
        req.params.id,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      if (!patient) return res.status(404).json({ error: "Patient not found" });

      // Check if user is from Dentures Direct office
      // Users with canViewAllOffices are Dentures Direct users
      // Otherwise, check their office name
      let isDenturesDirect = officeContext.canViewAllOffices;
      
      if (!isDenturesDirect && officeContext.officeId) {
        const { offices } = await import("@shared/schema");
        const { ensureDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const db = ensureDb();
        if (db) {
          const office = await db.select().from(offices).where(eq(offices.id, officeContext.officeId)).limit(1);
          if (office[0]?.name === "Dentures Direct") {
            isDenturesDirect = true;
          }
        }
      }

      if (!isDenturesDirect) {
        return res.status(403).json({ error: "Chart upload is only available for Dentures Direct office." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      // Extract text from PDF
      console.log(`📄 Extracting text from PDF for patient ${patient.name}...`);
      console.log(`📄 File size: ${req.file.size} bytes, type: ${req.file.mimetype}`);
      
      let chartText: string;
      try {
        chartText = await extractTextFromPDF(req.file.buffer);
      } catch (pdfError: any) {
        console.error("❌ PDF extraction failed:", pdfError);
        console.error("❌ PDF error stack:", pdfError.stack);
        return res.status(400).json({ 
          error: `PDF Extraction Error: ${pdfError.message || "Failed to extract text from PDF. The file may be image-based, corrupted, or password-protected."}` 
        });
      }

      if (!chartText || chartText.trim().length === 0) {
        return res.status(400).json({ error: "Could not extract text from PDF. The file may be image-based or corrupted." });
      }

      console.log(`✅ Extracted ${chartText.length} characters from PDF`);

      // Summarize chart using AI
      console.log(`🤖 Summarizing chart for patient ${patient.name}...`);
      let summary;
      try {
        summary = await summarizePatientChart(chartText, patient.name);
      } catch (aiError: any) {
        console.error("❌ AI summarization failed:", aiError);
        console.error("❌ AI error stack:", aiError.stack);
        return res.status(500).json({ 
          error: `AI Summarization Error: ${aiError.message || "Failed to summarize chart. Please check your OpenAI API key configuration."}` 
        });
      }

      // Optionally save the PDF as a patient file for reference
      try {
        const service = await getStorageService();
        // Get upload URL and upload the file
        const uploadUrl = await service.getObjectEntityUploadURL();
        
        // Upload file to the signed URL
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: req.file.buffer,
          headers: {
            'Content-Type': 'application/pdf',
          },
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
        }
        
        // Extract the object path from the upload URL
        // Supabase URL format: https://[project].supabase.co/storage/v1/object/sign/[bucket]/uploads/[uuid]?...
        const uploadUrlObj = new URL(uploadUrl);
        const pathParts = uploadUrlObj.pathname.split('/').filter(p => p);
        const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
        const objectPath = uploadsIndex >= 0 
          ? pathParts.slice(uploadsIndex).join('/')
          : `uploads/${Date.now()}.pdf`;
        
        const fileUrl = `/api/objects/${objectPath}`;
        
        await storage.createPatientFile({
          patientId: patient.id,
          filename: req.file.originalname || `chart-${Date.now()}.pdf`,
          fileUrl: fileUrl,
          fileType: 'application/pdf',
          description: 'Patient chart (uploaded for migration)'
        });
        console.log(`✅ Saved PDF as patient file for reference`);
      } catch (fileError: any) {
        console.warn(`⚠️  Could not save PDF file: ${fileError.message}`);
        // Don't fail the request if file saving fails
      }

      // Return summary for review (does NOT auto-save the clinical note)
      res.json({
        summary: summary.formattedNote,
        followUpPrompt: summary.followUpPrompt || null
      });
    } catch (error: any) {
      console.error("❌ Error processing chart upload:", error);
      console.error("❌ Error stack:", error.stack);
      
      // Provide more specific error messages
      let errorMessage = "Failed to process chart upload";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.toString) {
        errorMessage = error.toString();
      }
      
      // Check for specific error types
      if (errorMessage.includes("pdf") || errorMessage.includes("PDF")) {
        errorMessage = `PDF Error: ${errorMessage}`;
      } else if (errorMessage.includes("OpenAI") || errorMessage.includes("API key")) {
        errorMessage = `AI Processing Error: ${errorMessage}`;
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  // Save clinical note after clinician review/edit
  app.post("/api/clinical-notes/save", isAuthenticated, async (req: any, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const { patientId, content, noteDate, suggestedTasks } = req.body;
      const patient = await storage.getPatient(
        patientId,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
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
      
      // Create tasks from AI-extracted suggestedTasks (when clinician explicitly mentioned tasks)
      // ONLY create predetermination tasks when explicitly mentioned, and assign based on office
      if (suggestedTasks && Array.isArray(suggestedTasks) && suggestedTasks.length > 0) {
        // Get patient's office name to determine correct assignee for predetermination
        let patientOfficeName: string | null = null;
        if (patient.officeId) {
          try {
            const { offices } = await import("@shared/schema");
            const { ensureDb } = await import("./db");
            const db = ensureDb();
            if (db) {
              const { eq } = await import("drizzle-orm");
              const officeList = await db.select().from(offices).where(eq(offices.id, patient.officeId)).limit(1);
              if (officeList.length > 0) {
                patientOfficeName = officeList[0].name;
              }
            }
          } catch (error) {
            console.error("Failed to get office name:", error);
          }
        }
        
        for (const task of suggestedTasks) {
          try {
            // Check if this is a predetermination task
            const titleLower = (task.title || '').toLowerCase();
            const isPredetermination = titleLower.includes("pre-d") || 
                                      titleLower.includes("predetermination") || 
                                      titleLower.includes("pre determination") ||
                                      titleLower.includes("pre-d estimate") ||
                                      titleLower.includes("predetermination estimate");
            
            // For predetermination tasks, assign based on office
            let assignee = task.assignee || "All";
            if (isPredetermination) {
              if (patientOfficeName === "Dentures Direct") {
                assignee = "Caroline";
              } else if (patientOfficeName === "Toronto Smile Centre") {
                assignee = "Admin";
              }
              // If office not found, use the AI-suggested assignee
            }
            
            const createdTask = await storage.createTask({
              title: task.title,
              assignee: assignee,
              patientId: patient.id,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              priority: task.priority || "normal",
              status: "pending",
              description: `Task extracted from clinical note dated ${parsedNoteDate.toLocaleDateString()}`
            });
            
            // AUTO-UPDATE PREDETERMINATION STATUS: If a pre-D task is created, set predetermination status to "pending"
            if (isPredetermination && patient.predeterminationStatus !== "pending") {
              try {
                await storage.updatePatient(patient.id, {
                  predeterminationStatus: "pending"
                });
                console.log(`✅ Auto-updated predetermination status to "pending" for patient ${patient.name}`);
              } catch (error: any) {
                console.error("⚠️  Failed to auto-update predetermination status:", error.message);
              }
            }
          } catch (taskError: any) {
            console.error(`Failed to create task "${task.title}":`, taskError);
            // Continue creating other tasks even if one fails
          }
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
      const officeContext = await getUserOfficeContext(req);
      const { assignee, patientId, officeId } = req.query;
      
      // Debug: Check total tasks in database
      try {
        const { ensureDb } = await import("./db");
        const { tasks: tasksTable } = await import("@shared/schema");
        const db = ensureDb();
        if (db) {
          const allTasksInDb = await db.select().from(tasksTable);
          console.log(`🔍 DEBUG: Total tasks in database: ${allTasksInDb.length}`);
          if (allTasksInDb.length > 0) {
            const statusCounts = allTasksInDb.reduce((acc: Record<string, number>, t: any) => {
              const status = (t.status || 'null') as string;
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            console.log(`🔍 DEBUG: Task status breakdown:`, statusCounts);
          }
        }
      } catch (debugError) {
        console.warn("⚠️  Could not run debug query:", debugError);
      }
      
      const taskList = await storage.listTasks(
        assignee as string,
        patientId as string,
        officeContext.officeId,
        officeContext.canViewAllOffices,
        officeId as string | null
      );
      console.log(`📋 Fetched ${taskList.length} tasks (assignee: ${assignee || 'all'}, patientId: ${patientId || 'all'})`);
      res.json(taskList);
    } catch (error: any) {
      console.error("❌ Error fetching tasks:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // TEMPORARY DEBUG: Get ALL tasks (including completed) to check if they exist
  app.get("/api/tasks/debug-all", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { ensureDb } = await import("./db");
      const { tasks: tasksTable } = await import("@shared/schema");
      const db = ensureDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      const allTasks = await db.select().from(tasksTable).orderBy(desc(tasksTable.createdAt));
      res.json({ 
        total: allTasks.length,
        tasks: allTasks,
        statusBreakdown: allTasks.reduce((acc: Record<string, number>, t: any) => {
          const status = t.status || 'null';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      });
    } catch (error: any) {
      console.error("❌ Error in debug endpoint:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const user = req.user as any;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
      const task = await storage.updateTaskStatus(req.params.id, status, status === "completed" ? userName : undefined);
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get archived (completed) tasks - admin only
  app.get("/api/tasks/archived", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const selectedOfficeId = req.query.officeId as string | undefined;
      const archivedTasks = await storage.listArchivedTasks(
        officeContext.officeId,
        officeContext.canViewAllOffices,
        selectedOfficeId || null
      );
      res.json(archivedTasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create task endpoint (for manual task creation by clinician)
  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      
      console.log("📝 Creating task with data:", {
        title: req.body.title,
        assignee: req.body.assignee,
        priority: req.body.priority,
        hasDueDate: !!req.body.dueDate,
        dueDateType: typeof req.body.dueDate,
        patientId: req.body.patientId
      });
      
      // Validate required fields
      if (!req.body.title || !req.body.assignee) {
        return res.status(400).json({ error: "Title and assignee are required" });
      }
      
      // Convert dueDate from ISO string to Date if provided
      let dueDate: Date | null = null;
      if (req.body.dueDate) {
        try {
          dueDate = new Date(req.body.dueDate);
          if (isNaN(dueDate.getTime())) {
            console.warn("⚠️  Invalid dueDate provided, setting to null");
            dueDate = null;
          }
        } catch (e) {
          console.warn("⚠️  Error parsing dueDate:", e);
          dueDate = null;
        }
      }
      
      // Build task data - only include fields that exist in the schema
      // Exclude completedBy and completedAt as they're only set when task is completed
      const taskData: any = {
        title: req.body.title,
        description: req.body.description || null,
        assignee: req.body.assignee,
        priority: req.body.priority || "normal",
        status: req.body.status || "pending",
        dueDate: dueDate,
        patientId: req.body.patientId || null,
        officeId: req.body.officeId || null,
      };
      
      // If patientId is provided, get the patient to inherit officeId
      if (taskData.patientId && !taskData.officeId) {
        try {
          const patient = await storage.getPatient(
            taskData.patientId,
            officeContext.officeId,
            officeContext.canViewAllOffices
          );
          if (patient?.officeId) {
            taskData.officeId = patient.officeId;
          }
        } catch (error) {
          console.warn("⚠️  Could not get patient for officeId inheritance:", error);
        }
      }
      
      let task;
      try {
        task = await storage.createTask(taskData);
        console.log("✅ Task created successfully:", task.id);
      } catch (createError: any) {
        console.error("❌ Database error creating task:", createError);
        console.error("❌ Task data attempted:", JSON.stringify(taskData, null, 2));
        // If it's a column error, try without optional fields
        if (createError.message?.includes("column") || createError.message?.includes("does not exist")) {
          // Remove completedBy and completedAt if they're causing issues
          const { completedBy, completedAt, ...cleanTaskData } = taskData;
          try {
            task = await storage.createTask(cleanTaskData);
            console.log("✅ Task created successfully (retry):", task.id);
          } catch (retryError: any) {
            console.error("❌ Retry also failed:", retryError);
            throw new Error(`Failed to create task: ${retryError.message || createError.message}`);
          }
        } else {
          throw createError;
        }
      }
      
      // AUTO-UPDATE PREDETERMINATION STATUS: If a pre-D task is assigned, set predetermination status to "pending"
      if (taskData.patientId && taskData.title) {
        const titleLower = taskData.title.toLowerCase();
        const isPreDRelated = titleLower.includes("pre-d") || 
                             titleLower.includes("predetermination") || 
                             titleLower.includes("pre determination") ||
                             titleLower.includes("pre-d estimate") ||
                             titleLower.includes("predetermination estimate");
        
        if (isPreDRelated) {
          try {
            const patient = await storage.getPatient(taskData.patientId as string);
            if (patient && patient.predeterminationStatus !== "pending") {
              await storage.updatePatient(taskData.patientId as string, {
                predeterminationStatus: "pending"
              });
              console.log(`✅ Auto-updated predetermination status to "pending" for patient ${patient.name}`);
            }
          } catch (error: any) {
            console.error("⚠️  Failed to auto-update predetermination status:", error.message);
            // Don't fail the task creation if this update fails
          }
        }
      }
      
      res.json(task);
    } catch (error: any) {
      console.error("❌ Error creating task:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(400).json({ error: error.message || "Failed to create task" });
    }
  });

  // Clinical notes listing
  app.get("/api/clinical-notes/:patientId", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const notes = await storage.listClinicalNotes(
        req.params.patientId,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update clinical note
  app.patch("/api/clinical-notes/:id", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const noteId = req.params.id;
      
      // Get the note by searching through all accessible patients' notes
      const patients = await storage.listPatients(officeContext.officeId, officeContext.canViewAllOffices);
      let note = null;
      for (const patient of patients) {
        const notes = await storage.listClinicalNotes(patient.id, officeContext.officeId, officeContext.canViewAllOffices);
        const foundNote = notes.find(n => n.id === noteId);
        if (foundNote) {
          note = foundNote;
          break;
        }
      }
      
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Check if note was created today (same day edit restriction)
      const noteDate = note.noteDate ? new Date(note.noteDate) : new Date(note.createdAt);
      const today = new Date();
      const isSameDay = noteDate.toDateString() === today.toDateString();
      
      if (!isSameDay) {
        return res.status(403).json({ error: "Notes can only be edited on the same day they were created" });
      }

      const updated = await storage.updateClinicalNote(noteId, req.body);
      if (!updated) return res.status(404).json({ error: "Note not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete clinical note (admin only)
  app.delete("/api/clinical-notes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const noteId = req.params.id;
      
      // Get the note to verify it exists by searching through all accessible patients' notes
      const patients = await storage.listPatients(officeContext.officeId, officeContext.canViewAllOffices);
      let note = null;
      for (const patient of patients) {
        const notes = await storage.listClinicalNotes(patient.id, officeContext.officeId, officeContext.canViewAllOffices);
        const foundNote = notes.find(n => n.id === noteId);
        if (foundNote) {
          note = foundNote;
          break;
        }
      }
      
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      const success = await storage.deleteClinicalNote(noteId);
      if (!success) return res.status(404).json({ error: "Note not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Patient files
  app.get("/api/patients/:id/files", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const files = await storage.listPatientFiles(
        req.params.id,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/patients/:id/files", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      // Verify user can access this patient before creating file
      const patient = await storage.getPatient(
        req.params.id,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      
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
      const officeContext = await getUserOfficeContext(req);
      // Verify user can access this patient before deleting file
      const patient = await storage.getPatient(
        req.params.id,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      
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
      const officeContext = await getUserOfficeContext(req);
      // Verify user can access this patient
      const existingPatient = await storage.getPatient(
        req.params.id,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      if (!existingPatient) return res.status(404).json({ error: "Patient not found" });
      
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
  
  // Function to get or initialize storage service (checks at runtime, not just startup)
  async function getStorageService() {
    const hasSupabase = (process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL) && (process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
    
    if (hasSupabase && (!objectStorageService || objectStorageService.constructor.name === "ObjectStorageService")) {
      try {
        const { SupabaseStorageService } = await import("./supabaseStorage");
        objectStorageService = new SupabaseStorageService();
        console.log("💾 Using Supabase Storage for file uploads");
        console.log("🔍 SUPABASE_URL:", (process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL) ? "✅ Set" : "❌ Missing");
        console.log("🔍 SUPABASE_SERVICE_ROLE:", (process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY) ? "✅ Set" : "❌ Missing");
        console.log("🔍 SUPABASE_STORAGE_BUCKET:", process.env.SUPABASE_STORAGE_BUCKET || "patient-files (default)");
      } catch (error: any) {
        console.warn("⚠️  Failed to initialize Supabase Storage:", error.message);
        objectStorageService = new ObjectStorageService();
        console.log("💾 Using Replit Object Storage (fallback)");
      }
    } else if (!objectStorageService) {
      objectStorageService = new ObjectStorageService();
      console.log("💾 Using Replit Object Storage (fallback - Supabase not configured)");
      console.log("🔍 SUPABASE_URL:", process.env.SUPABASE_URL ? "✅ Set" : "❌ Missing");
      console.log("🔍 SUPABASE_SERVICE_ROLE:", (process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY) ? "✅ Set" : "❌ Missing");
    }
    
    return objectStorageService;
  }
  
  // Initialize on startup
  getStorageService().catch(console.error);
  
  // Debug endpoint to check configuration
  app.get("/api/debug/storage", isAuthenticated, (req, res) => {
    const hasSupabase = !!((process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL) && (process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY));
    const serviceType = objectStorageService?.constructor?.name || "Unknown";
    
    // Get ALL environment variables that start with SUPABASE (for debugging)
    const supabaseEnvVars: Record<string, string> = {};
    Object.keys(process.env).forEach(key => {
      if (key.toUpperCase().startsWith('SUPABASE')) {
        const value = process.env[key];
        if (value) {
          // Show first 10 chars and last 4 chars for security
          supabaseEnvVars[key] = value.length > 14 
            ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
            : "***";
        } else {
          supabaseEnvVars[key] = "(empty)";
        }
      }
    });
    
    // Also check for common typos
    const commonTypos = [
      'SUPABASEURL',
      'SUPABASE_URL_',
      'SUPABASE_SERVICE_KEY',
      'SUPABASE_SERVICE_ROLE',
      'SUPABASE_KEY',
    ];
    const foundTypos: Record<string, boolean> = {};
    commonTypos.forEach(typo => {
      foundTypos[typo] = !!process.env[typo];
    });
    
    res.json({
      hasSupabase,
      serviceType,
      supabaseUrl: (process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL) ? "✅ Set" : "❌ Missing",
      supabaseKey: (process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY) ? "✅ Set" : "❌ Missing",
      bucket: process.env.SUPABASE_STORAGE_BUCKET || "patient-files (default)",
      urlPrefix: (process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL)?.substring(0, 20) || "N/A",
      allSupabaseEnvVars: supabaseEnvVars,
      possibleTypos: foundTypos,
      rawUrlValue: (process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL) || null,
      rawKeyExists: !!(process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  });
  
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const service = await getStorageService(); // Check at runtime
      const signedUrl = await service.getObjectEntityUploadURL();
      res.json({ uploadURL: signedUrl });
    } catch (error: any) {
      console.error("❌ Photo upload error:", error.message);
      console.error("❌ Error stack:", error.stack);
      
      // Check if Supabase is configured
      const hasSupabase = (process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL) && (process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
      
      if (!hasSupabase) {
        res.status(500).json({ 
          error: "Photo upload is not configured. Please add SUPABASE_PROJECT_URL and SUPABASE_SERVICE_ROLE to Railway Variables. Photos are optional - you can continue without uploading photos."
        });
      } else {
        res.status(500).json({ 
          error: `Photo upload error: ${error.message}. Please check that the Supabase Storage bucket '${process.env.SUPABASE_STORAGE_BUCKET || "patient-files"}' exists and your service_role key has the correct permissions.`
        });
      }
    }
  });

  // Serve object storage files (for patient photos)
  // This route streams the file directly to the client for privacy
  app.get("/api/objects/*", isAuthenticated, async (req, res) => {
    try {
      const objectPath = `/objects/${req.params[0]}`;
      console.log("🔍 Attempting to retrieve file:", objectPath);
      const service = await getStorageService();
      const objectFile = await service.getObjectEntityFile(objectPath);
      console.log("✅ File found:", objectFile);
      await service.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("❌ Error serving object:", error);
      console.error("❌ Requested path:", `/objects/${req.params[0]}`);
      if (error.name === "ObjectNotFoundError") {
        return res.status(404).json({ error: "File not found" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Patient email notifications
  app.post("/api/patients/:id/notify", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const patient = await storage.getPatient(
        req.params.id,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
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

  // Toggle text notifications for a patient
  app.patch("/api/patients/:id/text-notifications", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: "enabled must be a boolean" });
      }
      
      const patient = await storage.getPatient(
        req.params.id,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      
      if (!patient.phone) {
        return res.status(400).json({ error: "Patient has no phone number. Please add a phone number before enabling text notifications." });
      }
      
      const updated = await storage.updatePatient(req.params.id, { textNotifications: enabled });
      if (!updated) return res.status(404).json({ error: "Patient not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle email notifications for a patient
  app.patch("/api/patients/:id/email-notifications", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: "Invalid request: 'enabled' must be a boolean" });
      }
      
      const patient = await storage.getPatient(
        req.params.id,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      
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
      const officeContext = await getUserOfficeContext(req);
      const notes = await storage.listLabNotes(
        req.params.patientId,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create lab note
  app.post("/api/lab-notes", isAuthenticated, async (req: any, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      console.log("Lab note request body:", JSON.stringify(req.body, null, 2));
      
      if (!req.body.patientId) {
        return res.status(400).json({ error: "Patient ID is required" });
      }
      
      // Verify user can access this patient
      const patient = await storage.getPatient(
        req.body.patientId,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      
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

  // Update lab note
  app.patch("/api/lab-notes/:id", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const noteId = req.params.id;
      
      // Get the note by searching through all accessible patients' notes
      const patients = await storage.listPatients(officeContext.officeId, officeContext.canViewAllOffices);
      let note = null;
      for (const patient of patients) {
        const notes = await storage.listLabNotes(patient.id, officeContext.officeId, officeContext.canViewAllOffices);
        const foundNote = notes.find(n => n.id === noteId);
        if (foundNote) {
          note = foundNote;
          break;
        }
      }
      
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Check if note was created today (same day edit restriction)
      const noteDate = new Date(note.createdAt);
      const today = new Date();
      const isSameDay = noteDate.toDateString() === today.toDateString();
      
      if (!isSameDay) {
        return res.status(403).json({ error: "Notes can only be edited on the same day they were created" });
      }

      const updated = await storage.updateLabNote(noteId, req.body);
      if (!updated) return res.status(404).json({ error: "Note not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== ADMIN NOTES =====
  // Get admin notes for a patient
  app.get("/api/admin-notes/:patientId", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const notes = await storage.listAdminNotes(
        req.params.patientId,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create admin note
  app.post("/api/admin-notes", isAuthenticated, async (req: any, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      
      if (!req.body.patientId) {
        return res.status(400).json({ error: "Patient ID is required" });
      }
      
      // Verify user can access this patient
      const patient = await storage.getPatient(
        req.body.patientId,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      
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
      
      // Check for insurance-related notifications in admin notes
      const contentLower = validatedData.content.toLowerCase();
      
      if (contentLower.includes("insurance approval") || contentLower.includes("approved by insurance") || contentLower.includes("claim approved")) {
        try {
          await sendPatientNotification(validatedData.patientId, "insurance_approval_received");
        } catch (error: any) {
          console.error("❌ Failed to send insurance approval notification:", error);
        }
      } else if (contentLower.includes("insurance denial") || contentLower.includes("denied by insurance") || contentLower.includes("claim denied")) {
        try {
          await sendPatientNotification(validatedData.patientId, "insurance_denial_received");
        } catch (error: any) {
          console.error("❌ Failed to send insurance denial notification:", error);
        }
      } else if (contentLower.includes("insurance") && (contentLower.includes("request") || contentLower.includes("need") || contentLower.includes("require"))) {
        try {
          await sendPatientNotification(validatedData.patientId, "insurance_info_requested");
        } catch (error: any) {
          console.error("❌ Failed to send insurance info requested notification:", error);
        }
      } else if (contentLower.includes("insurance") && (contentLower.includes("submitted") || contentLower.includes("sent") || contentLower.includes("provided"))) {
        try {
          await sendPatientNotification(validatedData.patientId, "insurance_info_submitted");
        } catch (error: any) {
          console.error("❌ Failed to send insurance info submitted notification:", error);
        }
      }
      
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
      const officeContext = await getUserOfficeContext(req);
      const prescriptions = await storage.listLabPrescriptions(
        req.params.patientId,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      res.json(prescriptions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single lab prescription
  app.get("/api/lab-prescription/:id", isAuthenticated, async (req, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      const prescription = await storage.getLabPrescription(
        req.params.id,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      if (!prescription) return res.status(404).json({ error: "Prescription not found" });
      res.json(prescription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create lab prescription
  app.post("/api/lab-prescriptions", isAuthenticated, async (req: any, res) => {
    try {
      const officeContext = await getUserOfficeContext(req);
      
      console.log("📋 Creating lab prescription with data:", {
        patientId: req.body.patientId,
        labName: req.body.labName,
        caseTypeUpper: req.body.caseTypeUpper,
        caseTypeLower: req.body.caseTypeLower,
        fabricationStageUpper: req.body.fabricationStageUpper,
        fabricationStageLower: req.body.fabricationStageLower,
        hasDeadline: !!req.body.deadline,
        digitalFiles: req.body.digitalFiles,
        hasDesignInstructions: !!req.body.designInstructions
      });
      
      // Validate required fields before schema validation
      if (!req.body.patientId) {
        return res.status(400).json({ error: "Patient ID is required" });
      }
      
      // Verify user can access this patient
      const patient = await storage.getPatient(
        req.body.patientId,
        officeContext.officeId,
        officeContext.canViewAllOffices
      );
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      if (!req.body.labName || req.body.labName.trim() === "") {
        return res.status(400).json({ error: "Lab name is required" });
      }
      if (!req.body.caseTypeUpper && !req.body.caseTypeLower) {
        return res.status(400).json({ error: "At least one case type (Upper or Lower) is required" });
      }
      if (req.body.caseTypeUpper && (!req.body.fabricationStageUpper || req.body.fabricationStageUpper.trim() === "")) {
        return res.status(400).json({ error: "Fabrication stage is required for upper case type" });
      }
      if (req.body.caseTypeLower && (!req.body.fabricationStageLower || req.body.fabricationStageLower.trim() === "")) {
        return res.status(400).json({ error: "Fabrication stage is required for lower case type" });
      }
      
      const validatedData = insertLabPrescriptionSchema.parse({
        ...req.body,
        labName: req.body.labName.trim(),
        caseTypeUpper: req.body.caseTypeUpper?.trim() || null,
        caseTypeLower: req.body.caseTypeLower?.trim() || null,
        fabricationStageUpper: req.body.fabricationStageUpper?.trim() || null,
        fabricationStageLower: req.body.fabricationStageLower?.trim() || null,
        status: req.body.status || "draft"
      });
      const user = req.user as any;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      
      const prescription = await storage.createLabPrescription({
        patientId: validatedData.patientId,
        labName: validatedData.labName,
        caseType: null, // deprecated field
        caseTypeUpper: validatedData.caseTypeUpper || null,
        caseTypeLower: validatedData.caseTypeLower || null,
        arch: null, // deprecated field
        fabricationStage: null, // deprecated field
        fabricationStageUpper: validatedData.fabricationStageUpper || null,
        fabricationStageLower: validatedData.fabricationStageLower || null,
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
      
      // Send notification when casting is sent out (if status is "sent")
      if (prescription.status === "sent") {
        try {
          await sendPatientNotification(prescription.patientId, "casting_sent");
        } catch (error: any) {
          console.error("❌ Failed to send casting notification:", error);
          // Don't fail the request if notification fails
        }
      }
      
      res.json(prescription);
    } catch (error: any) {
      console.error("❌ Error creating lab prescription:", error);
      console.error("❌ Error stack:", error.stack);
      if (error.errors) {
        console.error("❌ Validation errors:", error.errors);
        return res.status(400).json({ error: `Validation error: ${error.errors.map((e: any) => e.message).join(", ")}` });
      }
      res.status(400).json({ error: error.message || "Failed to create lab prescription" });
    }
  });

  // Update lab prescription (mark as sent, update status, etc.)
  app.patch("/api/lab-prescriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      
      // Get prescription before update to check if status is changing to "sent"
      const currentPrescription = await storage.getLabPrescription(req.params.id);
      const isBeingMarkedAsSent = updates.status === "sent" && currentPrescription?.status !== "sent";
      
      // If marking as sent, set the sentAt timestamp
      if (updates.status === "sent" && !updates.sentAt) {
        updates.sentAt = new Date();
      }
      
      const prescription = await storage.updateLabPrescription(req.params.id, updates);
      if (!prescription) return res.status(404).json({ error: "Prescription not found" });
      
      // Send notification when casting is sent out (any fabrication stage)
      if (isBeingMarkedAsSent) {
        try {
          await sendPatientNotification(prescription.patientId, "casting_sent");
        } catch (error: any) {
          console.error("❌ Failed to send casting notification:", error);
          // Don't fail the request if notification fails
        }
      }
      
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

  // Debug endpoint for login issues
  app.get("/api/debug/auth", async (req, res) => {
    const checks: Record<string, any> = {
      sessionSecret: !!process.env.SESSION_SECRET,
      databaseUrl: !!process.env.DATABASE_URL,
      useMemStorage: process.env.USE_MEM_STORAGE === "1",
      nodeEnv: process.env.NODE_ENV,
    };

    // Try to check if users table exists and has data
    try {
      const testUser = await storage.getUserByEmail("damien@denturesdirect.ca");
      checks.userExists = !!testUser;
      checks.userHasPassword = !!testUser?.password;
    } catch (error: any) {
      checks.userCheckError = error.message;
    }

    // Check session
    checks.isAuthenticated = req.isAuthenticated();
    checks.hasUser = !!req.user;

    res.json(checks);
  });

  const httpServer = createServer(app);
  return httpServer;
}