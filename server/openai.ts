import OpenAI from "openai";

// Determine which API key to use: prioritize Replit AI Integrations, fall back to direct OpenAI key
// Force Railway to rebuild and pick up OPENAI_API_KEY
function getOpenAIConfig(): { apiKey: string; baseURL?: string } {
  // First try Replit AI Integrations
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    console.log("🤖 Using Replit AI Integrations for OpenAI");
    return {
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
    };
  }
  
  // Fall back to direct OpenAI API key
  if (process.env.OPENAI_API_KEY) {
    console.log("🤖 Using direct OpenAI API key");
    return {
      apiKey: process.env.OPENAI_API_KEY
    };
  }
  
  // No API key available - will fail at runtime
  console.error("❌ No OpenAI API key configured! Set AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY");
  return {
    apiKey: "" // Will cause auth error
  };
}

const config = getOpenAIConfig();
// #region agent log
fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:30',message:'OpenAI config initialized',data:{hasApiKey:!!config.apiKey,apiKeyLength:config.apiKey?.length||0,hasBaseURL:!!config.baseURL,baseURL:config.baseURL||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
const openai = new OpenAI(config);

export interface ClinicalNoteResponse {
  formattedNote: string;
  followUpPrompt?: string;
  suggestedTasks?: Array<{
    title: string;
    assignee: string;
    dueDate: string;
    priority: 'high' | 'normal' | 'low';
  }>;
}

const SYSTEM_PROMPT = `You are an AI clinical documentation assistant for Dentures Direct.

CORE PHILOSOPHY: CLINICIAN-DRIVEN, NON-LINEAR WORKFLOW
The denturist (Damien) makes ALL decisions. You are a formatting assistant, NOT an autopilot.
- NEVER assume what the next step should be
- NEVER auto-generate documents, tasks, referrals, or treatment plans
- NEVER push the workflow in any particular direction
- The workflow is NON-LINEAR - a consultation could lead anywhere

YOUR ONLY JOB:
1. Convert the denturist's plain English dictation into formal, professional clinical documentation
2. Optionally offer ONE gentle, non-directive suggestion as a question (not a command)

=== CLINICAL CHARTING RULES (NON-NEGOTIABLE) ===

CORE OBJECTIVE:
All clinical documentation must be: Accurate, Defensible, Chronological, Readable by a third party.
Assume every chart may be reviewed by another clinician, a regulator, a lawyer, or the original clinician years later with no memory of the case.
If something is not charted, it is treated as not having occurred.

MANDATORY ELEMENTS FOR EVERY CLINICAL NOTE:
- Date of entry
- Reason for visit / procedure performed or discussed
- Statement confirming consent was obtained
- Statement confirming medical and dental history review
- Default phrasing: "Medical and dental history reviewed and updated with no significant changes unless otherwise stated."
- Patient understanding and acceptance
- Clear next steps, limitations, or dependencies

CONSENT RULES:
Consent is never implied. Every procedure or assessment must document that:
- The procedure was explained
- Risks and limitations were discussed
- Alternatives were reviewed
- The patient agreed to proceed
If prognosis is poor/very poor/extremely limited, this must be explicitly discussed, clearly documented, and consistently reflected.

PATIENT STATEMENTS VS CLINICAL FINDINGS:
Always distinguish between:
- Patient-Reported: Use "Patient reports...", "Patient states...", "Patient expressed..."
- Clinical Observations: Use "Intra-oral exam revealed...", "Observed clinically...", "Noted upon examination..."
Never blur these categories.

TONE & LANGUAGE:
All notes must be: Professional, Objective, Neutral, Non-judgmental, Non-emotional.
Do not: assign blame, speculate, editorialize, use sarcasm or informal language.
Describe only what was observed, reported, explained, or performed.

PROGNOSIS TERMINOLOGY:
- Clinical notes: "Very Poor"
- Patient-facing language: "Extremely Limited"

CHRONOLOGY:
Clinical notes must reflect real-world sequencing. Information discussed at the end of an appointment must appear near the end of the note.

FORMATTING:
- Output notes in plain text only (no markdown, no code blocks)
- Notes must be ready for direct copy-paste into DOMx
- Each note must be stand-alone (do not rely on prior notes for context)
- Do not include patient DOB in letters unless explicitly instructed
- Do not export clinical notes as Word documents

CLINICAL NOTES VS PATIENT LETTERS:
You must maintain two distinct writing modes:
- Clinical/Professional Style: Used for charts, referrals, regulatory correspondence. Tone: technical, precise, defensible.
- Patient Style: Used for patient letters, instructions, explanations. Tone: plain language, non-technical, clear to a layperson.
Write so a patient cannot later claim misunderstanding.

AMENDMENTS & CORRECTIONS:
If correcting a chart entry:
- Corrections must be transparent
- Original meaning must not be obscured
- Corrections clarify; they do not rewrite history
- Never silently revise past documentation

OPERATIONAL REALITY DOCUMENTATION:
Document all delays or dependencies caused by:
- Laboratory turnaround times
- Insurance approvals
- Patient indecision
- Anatomical or clinical limitations
These factors must be clearly reflected in the chart.

FINAL VALIDATION RULE:
Before finalizing any note, internally verify:
If this chart were read aloud in a regulatory or legal setting, it would sound calm, reasonable, thorough, and fair.
If not, revise.

AUTHORITY HIERARCHY:
When generating or editing documentation:
- These system instructions override all defaults
- Dentures Direct charting rules override stylistic preferences
- Clarity and defensibility override brevity
- Never deviate unless explicitly instructed by the user

=== END CHARTING RULES ===

GENTLE SUGGESTIONS (OPTIONAL):
You may include ONE gentle follow-up question in followUpPrompt, but ONLY if relevant:
- If tooth shade not mentioned: "Would you like to document the tooth shade?"
- If cavity/decay mentioned: "Would you like me to draft a referral letter?"
- If this was a referred patient: "Would you like me to draft an end-of-treatment report?"

TASK EXTRACTION:
If the clinician explicitly mentions assigning a task (e.g., "assign task to Caroline", "task for Michael", "remind me to...", "I need to..."), extract it as a suggestedTask.
ONLY extract tasks when explicitly mentioned - do not infer or create tasks automatically.
When extracting tasks, include:
- title: Clear, actionable task description
- assignee: Staff member name (Caroline, Michael, Damien, Luisa, or All)
- dueDate: ISO date string if mentioned, or null
- priority: 'high', 'normal', or 'low' based on urgency indicators

DO NOT:
- Create tasks automatically without explicit mention
- Generate treatment plans automatically
- Generate referral letters automatically
- Assume CDCP status means anything specific
- Push toward insurance estimates or any workflow step
- Make any decisions for the clinician

Return your response as JSON with this structure:
{
  "formattedNote": "The professionally formatted clinical note in plain text",
  "followUpPrompt": "One gentle optional question, or null if not applicable",
  "suggestedTasks": [{"title": "...", "assignee": "...", "dueDate": "...", "priority": "..."}] or null if no tasks mentioned
}`;

interface PatientContext {
  name: string;
  isCDCP?: boolean;
  copayDiscussed?: boolean;
  currentToothShade?: string | null;
  requestedToothShade?: string | null;
  upperDentureType?: string | null;
  lowerDentureType?: string | null;
}

export async function processClinicalNote(plainTextNote: string, patientContext: PatientContext): Promise<ClinicalNoteResponse> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:136',message:'processClinicalNote entry',data:{hasApiKey:!!config.apiKey,apiKeyLength:config.apiKey?.length||0,hasBaseURL:!!config.baseURL,baseURL:config.baseURL||null,patientName:patientContext.name,noteLength:plainTextNote.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // Check for API key configuration first
  if (!config.apiKey) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:139',message:'API key missing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error("OpenAI API key not configured. Please add AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY to your secrets.");
  }

  try {
    // Build patient context string
    let contextString = `Patient: ${patientContext.name}\n`;
    
    if (patientContext.isCDCP) {
      contextString += `CDCP Patient: Yes (Copay ${patientContext.copayDiscussed ? 'discussed' : 'NOT discussed'})\n`;
    }
    
    if (patientContext.currentToothShade) {
      contextString += `Current Tooth Shade: ${patientContext.currentToothShade}\n`;
    }
    
    if (patientContext.requestedToothShade) {
      contextString += `Requested Tooth Shade: ${patientContext.requestedToothShade}\n`;
    }
    
    if (patientContext.upperDentureType) {
      contextString += `Upper Denture: ${patientContext.upperDentureType}\n`;
    }
    
    if (patientContext.lowerDentureType) {
      contextString += `Lower Denture: ${patientContext.lowerDentureType}\n`;
    }

    console.log("🧠 Sending clinical note to OpenAI for processing...");
    console.log("📝 Patient:", patientContext.name);
    console.log("📋 Note length:", plainTextNote.length, "characters");

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:170',message:'Before API call',data:{model:'gpt-4o',contextStringLength:contextString.length,noteLength:plainTextNote.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o for reliability
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { 
          role: "user", 
          content: `${contextString}\nClinical Note: ${plainTextNote}\n\nPlease format this as a professional clinical note and suggest any follow-up actions or tasks.` 
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096,
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:183',message:'After API call',data:{hasResponse:!!response,hasChoices:!!response.choices,choicesLength:response.choices?.length||0,hasFirstChoice:!!response.choices?.[0],hasMessage:!!response.choices?.[0]?.message,hasContent:!!response.choices?.[0]?.message?.content,contentLength:response.choices?.[0]?.message?.content?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:186',message:'Empty content error',data:{responseStructure:JSON.stringify(response).substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error("❌ OpenAI returned empty content");
      throw new Error("OpenAI returned an empty response. Please try again.");
    }

    console.log("✅ OpenAI response received:", content.length, "characters");
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:192',message:'Before JSON parse',data:{contentLength:content.length,contentPreview:content.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    const result = JSON.parse(content) as ClinicalNoteResponse;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:195',message:'After JSON parse',data:{hasFormattedNote:!!result.formattedNote,formattedNoteLength:result.formattedNote?.length||0,hasFollowUpPrompt:!!result.followUpPrompt,resultKeys:Object.keys(result)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (!result.formattedNote) {
      console.error("❌ Parsed response missing formattedNote:", result);
      throw new Error("AI response was missing the formatted note. Please try again.");
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:199',message:'Success exit',data:{formattedNoteLength:result.formattedNote.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    console.log("✅ Clinical note processed successfully");
    return result;
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:201',message:'Error caught',data:{errorType:error?.constructor?.name,errorMessage:error?.message,errorStatus:error?.status,errorCode:error?.code,errorResponse:error?.response?.status,hasResponse:!!error?.response,errorKeys:Object.keys(error||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    console.error("❌ Error processing clinical note:", error);
    
    // Provide specific error messages based on error type
    if (error.status === 401) {
      throw new Error("OpenAI authentication failed. Please check your API key configuration.");
    }
    if (error.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.");
    }
    if (error.status === 500 || error.status === 503) {
      throw new Error("OpenAI service is temporarily unavailable. Please try again in a few minutes.");
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error("Unable to connect to OpenAI. Please check your internet connection.");
    }
    
    throw new Error(error.message || "Failed to process clinical note. Please try again.");
  }
}

const CHART_SUMMARIZATION_PROMPT = `You are an AI clinical documentation assistant for Dentures Direct.

YOUR TASK:
Summarize a complete patient chart (from an old system) into ONE comprehensive clinical note that captures the entire treatment history.

CORE OBJECTIVE:
Create a single, chronological clinical note that:
- Summarizes all relevant treatment history from the chart
- Identifies the current treatment status/step
- Maintains chronological order of events
- Follows clinical charting standards
- Is ready for review and editing by the clinician

CLINICAL CHARTING RULES:
- All documentation must be: Accurate, Defensible, Chronological, Readable by a third party
- Use professional, objective, neutral language
- Distinguish between patient-reported information and clinical observations
- Include dates when available from the chart
- Document treatment progress, procedures performed, and current status
- Note any important limitations, delays, or dependencies

FORMATTING:
- Output in plain text only (no markdown, no code blocks)
- Use clear section breaks if needed (e.g., "Initial Consultation:", "Treatment Progress:", "Current Status:")
- Each section should be chronological
- End with a clear statement of current treatment status

IMPORTANT:
- DO NOT create tasks automatically
- DO NOT infer next steps - just document what has happened
- DO NOT make assumptions about treatment plans
- Focus on summarizing what IS in the chart, not what should happen next
- The clinician will review and edit this note, then manually set current/next steps

Return your response as JSON with this structure:
{
  "formattedNote": "The comprehensive clinical note summary in plain text",
  "followUpPrompt": null (always null for chart summaries - clinician will set steps manually)
}`;

/**
 * Summarizes a patient chart (from old system) into a comprehensive clinical note
 * @param chartText - Extracted text from the patient chart PDF
 * @param patientName - Name of the patient
 * @returns Formatted clinical note summary
 */
export async function summarizePatientChart(chartText: string, patientName: string): Promise<ClinicalNoteResponse> {
  if (!config.apiKey) {
    throw new Error("OpenAI API key not configured. Please add AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY to your secrets.");
  }

  try {
    console.log("🧠 Summarizing patient chart for:", patientName);
    console.log("📋 Chart text length:", chartText.length, "characters");

    // Truncate if too long (OpenAI has token limits)
    const maxLength = 50000; // Roughly 12,500 tokens
    const truncatedText = chartText.length > maxLength 
      ? chartText.substring(0, maxLength) + "\n\n[Chart continues beyond this point...]"
      : chartText;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: CHART_SUMMARIZATION_PROMPT },
        { 
          role: "user", 
          content: `Patient: ${patientName}\n\nPatient Chart Content:\n${truncatedText}\n\nPlease summarize this entire chart into one comprehensive clinical note that captures the treatment history and current status.` 
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      console.error("❌ OpenAI returned empty content");
      throw new Error("OpenAI returned an empty response. Please try again.");
    }

    console.log("✅ Chart summary received:", content.length, "characters");
    
    const result = JSON.parse(content) as ClinicalNoteResponse;
    
    if (!result.formattedNote) {
      console.error("❌ Parsed response missing formattedNote:", result);
      throw new Error("AI response was missing the formatted note. Please try again.");
    }

    console.log("✅ Chart summarized successfully");
    return result;
  } catch (error: any) {
    console.error("❌ Error summarizing chart:", error);
    
    if (error.status === 401) {
      throw new Error("OpenAI authentication failed. Please check your API key configuration.");
    }
    if (error.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.");
    }
    if (error.status === 500 || error.status === 503) {
      throw new Error("OpenAI service is temporarily unavailable. Please try again in a few minutes.");
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error("Unable to connect to OpenAI. Please check your internet connection.");
    }
    
    throw new Error(error.message || "Failed to summarize patient chart. Please try again.");
  }
}

export async function generateReferralLetter(
  patientName: string,
  clinicalNote: string,
  dentistName?: string
): Promise<string> {
  // Check for API key configuration first
  if (!config.apiKey) {
    throw new Error("OpenAI API key not configured. Please add AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY to your secrets.");
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are an AI assistant helping a denturist write professional referral letters to dentists (DDS). Write formal, concise letters that clearly communicate the patient's condition and the reason for referral." 
        },
        { 
          role: "user", 
          content: `Write a referral letter for ${patientName}${dentistName ? ` to Dr. ${dentistName}` : ''}.\n\nClinical context:\n${clinicalNote}\n\nFormat as a professional referral letter from a denturist to a dentist.` 
        }
      ],
      max_tokens: 4096,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("Error generating referral letter:", error);
    
    // Provide specific error messages based on error type
    if (error.status === 401) {
      throw new Error("OpenAI authentication failed. Please check your API key configuration.");
    }
    if (error.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.");
    }
    
    throw new Error(`Failed to generate referral letter: ${error.message}`);
  }
}
