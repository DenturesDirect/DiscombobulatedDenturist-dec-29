/**
 * Extracts text content from a PDF file buffer using unpdf (serverless-friendly)
 * @param buffer - PDF file as Buffer
 * @returns Extracted text content
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Use unpdf which is designed for serverless/Node.js environments
    const { extractText, getDocumentProxy } = await import("unpdf");
    
    // Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(buffer);
    
    // Load the PDF document
    const pdf = await getDocumentProxy(uint8Array);
    
    // Extract text from all pages
    const { text } = await extractText(pdf, { mergePages: true });
    
    return text || "";
  } catch (error: any) {
    if (error.message?.includes("Invalid PDF") || error.message?.includes("corrupted") || error.message?.includes("Invalid")) {
      throw new Error("The PDF file appears to be corrupted or invalid. Please try a different file.");
    }
    if (error.message?.includes("password") || error.message?.includes("encrypted")) {
      throw new Error("The PDF file is password-protected. Please remove the password and try again.");
    }
    throw new Error(`Failed to extract text from PDF: ${error.message || "Unknown error"}`);
  }
}
