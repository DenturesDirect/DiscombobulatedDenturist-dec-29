/**
 * Extracts text content from a PDF file buffer
 * @param buffer - PDF file as Buffer
 * @returns Extracted text content
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Lazy-load createRequire at runtime to avoid esbuild bundling issues
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const pdfParse = require("pdf-parse");
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
