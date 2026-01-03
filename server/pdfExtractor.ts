import { createRequire } from "module";
const require = createRequire(import.meta.url);

/**
 * Extracts text content from a PDF file buffer
 * @param buffer - PDF file as Buffer
 * @returns Extracted text content
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Use require for CommonJS module compatibility
    const pdfParseModule = require("pdf-parse");
    // pdf-parse can export as default or directly - handle both
    let pdfParse: any;
    if (typeof pdfParseModule === 'function') {
      pdfParse = pdfParseModule;
    } else if (pdfParseModule.default && typeof pdfParseModule.default === 'function') {
      pdfParse = pdfParseModule.default;
    } else {
      // Try to find the function in the module
      pdfParse = pdfParseModule.pdfParse || pdfParseModule;
    }
    
    if (typeof pdfParse !== 'function') {
      throw new Error(`pdf-parse is not a function. Got type: ${typeof pdfParse}, keys: ${Object.keys(pdfParseModule).join(', ')}`);
    }
    
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error: any) {
    if (error.message?.includes("Invalid PDF") || error.message?.includes("corrupted")) {
      throw new Error("The PDF file appears to be corrupted or invalid. Please try a different file.");
    }
    if (error.message?.includes("password")) {
      throw new Error("The PDF file is password-protected. Please remove the password and try again.");
    }
    throw new Error(`Failed to extract text from PDF: ${error.message || "Unknown error"}`);
  }
}
