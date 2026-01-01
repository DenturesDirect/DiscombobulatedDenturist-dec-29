// Script to list available Gemini models
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error("❌ GOOGLE_AI_API_KEY not set");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    console.log("🔍 Listing available models...");
    
    // Try to get available models
    const models = await genAI.listModels();
    
    console.log("\n✅ Available models:");
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Display Name: ${model.displayName || 'N/A'}`);
      console.log(`   Description: ${model.description || 'N/A'}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log("");
    });
    
  } catch (error) {
    console.error("❌ Error listing models:", error.message);
    console.error("\nTrying direct API call...");
    
    // Fallback: try common model names
    const commonModels = [
      "gemini-pro",
      "models/gemini-pro",
      "gemini-1.5-pro",
      "models/gemini-1.5-pro",
      "gemini-1.5-flash",
      "models/gemini-1.5-flash"
    ];
    
    console.log("\n🔍 Testing common model names:");
    for (const modelName of commonModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Just test if we can create the model object
        console.log(`✅ ${modelName} - Model object created successfully`);
      } catch (err) {
        console.log(`❌ ${modelName} - ${err.message}`);
      }
    }
  }
}

listModels();
