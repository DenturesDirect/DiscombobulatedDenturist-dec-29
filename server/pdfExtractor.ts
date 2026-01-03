/**
 * Extracts text content from a PDF file buffer
 * @param buffer - PDF file as Buffer
 * @returns Extracted text content
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid bundling issues - load at runtime
    const pdfParseModule = await import("@cedrugs/pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;
    
    if (typeof pdfParse !== 'function') {
      throw new Error(`pdf-parse is not a function. Please ensure @cedrugs/pdf-parse is installed.`);
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
