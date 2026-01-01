import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google AI Studio (Gemini API) - Much simpler than Google Cloud!
// Just needs an API key from https://aistudio.google.com/
let genAI: GoogleGenerativeAI | null = null;

function getGeminiConfig() {
  if (genAI) return genAI;
  
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.error("❌ GOOGLE_AI_API_KEY must be set");
    throw new Error("Google AI API key not configured. Get one from https://aistudio.google.com/");
  }

  console.log("🤖 Using Google AI Studio (Gemini API)");
  
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

const getModel = () => getGeminiConfig().getGenerativeModel({ 
  model: "gemini-1.5-flash", // Using flash for better availability, can change to "gemini-1.5-pro" if needed
  generationConfig: {
    maxOutputTokens: 4096,
    temperature: 0.7,
  }
});

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

=== END CHARTING RULES ===

GENTLE SUGGESTIONS (OPTIONAL):
You may include ONE gentle follow-up question in followUpPrompt, but ONLY if relevant:
- If tooth shade not mentioned: "Would you like to document the tooth shade?"
- If cavity/decay mentioned: "Would you like me to draft a referral letter?"
- If this was a referred patient: "Would you like me to draft an end-of-treatment report?"

DO NOT:
- Create tasks automatically
- Generate treatment plans automatically
- Generate referral letters automatically
- Assume CDCP status means anything specific
- Push toward insurance estimates or any workflow step
- Make any decisions for the clinician

Return your response as JSON with this structure:
{
  "formattedNote": "The professionally formatted clinical note in plain text",
  "followUpPrompt": "One gentle optional question, or null if not applicable"
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

    console.log("🧠 Sending clinical note to Google AI Studio (Gemini 1.5 Pro) for processing...");
    console.log("📝 Patient:", patientContext.name);
    console.log("📋 Note length:", plainTextNote.length, "characters");

    const prompt = `${SYSTEM_PROMPT}\n\n${contextString}\nClinical Note: ${plainTextNote}\n\nPlease format this as a professional clinical note and suggest any follow-up actions or tasks. Return your response as JSON.`;

    const model = getModel();
    const result = await model.generateContent(prompt);

    const response = result.response;
    const content = response.text();
    
    if (!content) {
      console.error("❌ Gemini API returned empty content");
      throw new Error("Gemini API returned an empty response. Please try again.");
    }

    console.log("✅ Gemini API response received:", content.length, "characters");
    
    const parsedResult = JSON.parse(content) as ClinicalNoteResponse;
    
    if (!parsedResult.formattedNote) {
      console.error("❌ Parsed response missing formattedNote:", parsedResult);
      throw new Error("AI response was missing the formatted note. Please try again.");
    }

    console.log("✅ Clinical note processed successfully");
    return parsedResult;
  } catch (error: any) {
    console.error("❌ Error processing clinical note:", error);
    
    // Provide specific error messages based on error type
    if (error.message?.includes("API_KEY") || error.message?.includes("authentication")) {
      throw new Error("Google AI API authentication failed. Please check your API key from https://aistudio.google.com/");
    }
    if (error.message?.includes("quota") || error.message?.includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.");
    }
    if (error.message?.includes("unavailable") || error.status === 503) {
      throw new Error("Google AI service is temporarily unavailable. Please try again in a few minutes.");
    }
    
    throw new Error(error.message || "Failed to process clinical note. Please try again.");
  }
}

export async function generateReferralLetter(
  patientName: string,
  clinicalNote: string,
  dentistName?: string
): Promise<string> {
  try {
    const prompt = `Write a referral letter for ${patientName}${dentistName ? ` to Dr. ${dentistName}` : ''}.\n\nClinical context:\n${clinicalNote}\n\nFormat as a professional referral letter from a denturist to a dentist.`;

    const model = getModel();
    const result = await model.generateContent(prompt);

    const response = result.response;
    const content = response.text();
    
    return content || "";
  } catch (error: any) {
    console.error("Error generating referral letter:", error);
    
    if (error.message?.includes("API_KEY") || error.message?.includes("authentication")) {
      throw new Error("Google AI API authentication failed. Please check your API key from https://aistudio.google.com/");
    }
    if (error.message?.includes("quota") || error.message?.includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.");
    }
    
    throw new Error(`Failed to generate referral letter: ${error.message}`);
  }
}
