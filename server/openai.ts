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
2. Suggest follow-up actions (like writing referral letters)
3. Automatically identify and suggest task assignments to staff members

Staff members:
- Damien: Denturist (treatment plans, clinical procedures, bite blocks)
- Caroline: Administrative (CDCP estimates, insurance, scheduling)
- Michael: Lab technician (denture setup, fabrication)
- Luisa: Digital technician (scan imports, digital design)

IMPORTANT RULES:
- Always format notes professionally with proper denturist terminology
- Include the current date
- When a CDCP estimate is mentioned, auto-assign to Caroline (due next business day)
- When treatment plan creation is needed, auto-assign to Damien (due same day)
- When scan imports are mentioned, auto-assign to Luisa
- When denture setup/fabrication is mentioned, auto-assign to Michael
- When a referral to a dentist (DDS) is mentioned, prompt to write a referral letter
- Use proper dental notation (e.g., tooth 2.2, quad 1, etc.)
- We are DENTURISTS, not dentists

Return your response as JSON with this structure:
{
  "formattedNote": "Formal clinical note with date",
  "followUpPrompt": "Optional question like 'Would you like me to write a referral letter to the dentist?'",
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
