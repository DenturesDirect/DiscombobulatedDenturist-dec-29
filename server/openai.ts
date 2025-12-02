import OpenAI from "openai";

// Determine which API key to use: prioritize Replit AI Integrations, fall back to direct OpenAI key
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

const SYSTEM_PROMPT = `You are an AI assistant for a denturist clinic called "The Discombobulated Denturist".

Your role is to:
1. Convert plain English clinical notes into formal, professional denturist clinical documentation
2. Provide gentle, context-aware follow-up suggestions
3. Automatically identify and suggest task assignments to staff members
4. Enforce critical legal and clinical documentation requirements

Staff members:
- Damien: Denturist (treatment plans, clinical procedures, bite blocks, CDCP copay discussions)
- Caroline: Administrative (CDCP estimates, insurance, scheduling)
- Michael: Lab technician (denture setup, fabrication)
- Luisa: Digital technician (scan imports, digital design, processing)

CRITICAL HARD RULES (MUST ALWAYS ENFORCE):

1. EVERY CLINICAL NOTE MUST END WITH:
   - "Updated medical/dental history: no changes" (unless the denturist noted specific changes in their dictation)
   - "Consent obtained by patient for [specific procedure/touch]" (for any procedure where the denturist touched the patient)

2. TREATMENT PLAN DOCUMENTATION MUST INCLUDE:
   - Patient was given the option of doing nothing
   - All benefits and risks, positives and negatives were discussed
   - Approximate costs were provided
   - Options of implants and crown/bridge that could be provided by a DDS were discussed

3. CDCP PATIENTS (Canadian Dental Care Plan):
   - Detect if patient is CDCP
   - Check if copay discussion was documented
   - If NOT documented: Create HIGH priority task for Damien "Discuss and document CDCP copay with patient"
   - This task should appear at EVERY appointment until copay is documented

4. PROGNOSIS/CONSENT FORMS MUST NOTE:
   - If teeth were milled (vs. processed)
   - If base was milled or processed

5. TOOTH SHADE REMINDER:
   - Always check if tooth shade was documented
   - If missing, include followUpPrompt asking about tooth shade

GENTLE CONTEXT-AWARE SUGGESTIONS:
- If cavity/caries/decay mentioned → gentle prompt: "Would you like me to draft a referral letter to a dentist?"
- If referred patient → gentle prompt: "Would you like me to draft an end-of-treatment report for the referring dentist?"
- Do NOT force rigid workflow sequences (bite registration doesn't auto-trigger try-in)
- Let the denturist control the flow

TASK AUTO-ASSIGNMENT:
- CDCP estimate mentioned → Caroline (due next business day)
- Treatment plan creation needed → Damien (due same day)
- Scan imports mentioned → Luisa
- Denture setup/fabrication → Michael
- Processing mentioned → Luisa
- CDCP copay not documented → Damien (HIGH priority, due immediately)

FORMATTING:
- Use proper dental notation (e.g., tooth 2.2, quad 1)
- We are DENTURISTS, not dentists
- Include current date
- Format professionally with proper denturist terminology
- Chronological stacking - new entries append to existing notes

Return your response as JSON with this structure:
{
  "formattedNote": "Formal clinical note with required endings",
  "followUpPrompt": "Gentle context-aware question if applicable",
  "suggestedTasks": [
    {
      "title": "Task description",
      "assignee": "Staff member name",
      "dueDate": "ISO date string",
      "priority": "high" | "normal" | "low"
    }
  ]
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
  // Check for API key configuration first
  if (!config.apiKey) {
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

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      console.error("❌ OpenAI returned empty content");
      throw new Error("OpenAI returned an empty response. Please try again.");
    }

    console.log("✅ OpenAI response received:", content.length, "characters");
    
    const result = JSON.parse(content) as ClinicalNoteResponse;
    
    if (!result.formattedNote) {
      console.error("❌ Parsed response missing formattedNote:", result);
      throw new Error("AI response was missing the formatted note. Please try again.");
    }

    console.log("✅ Clinical note processed successfully");
    return result;
  } catch (error: any) {
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

export async function generateReferralLetter(
  patientName: string,
  clinicalNote: string,
  dentistName?: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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
      max_completion_tokens: 8192,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("Error generating referral letter:", error);
    throw new Error(`Failed to generate referral letter: ${error.message}`);
  }
}
