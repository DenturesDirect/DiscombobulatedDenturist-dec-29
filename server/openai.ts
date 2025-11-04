import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
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

export async function processClinicalNote(plainTextNote: string, patientName: string): Promise<ClinicalNoteResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { 
          role: "user", 
          content: `Patient: ${patientName}\n\nClinical Note: ${plainTextNote}\n\nPlease format this as a professional clinical note and suggest any follow-up actions or tasks.` 
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content) as ClinicalNoteResponse;
    
    return result;
  } catch (error: any) {
    console.error("Error processing clinical note:", error);
    throw new Error(`Failed to process clinical note: ${error.message}`);
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
