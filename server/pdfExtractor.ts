/**
 * Extracts text content from a PDF file buffer using pdfjs-dist (ESM-compatible)
 * @param buffer - PDF file as Buffer
 * @returns Extracted text content
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Use pdfjs-dist - try main entry point first, fallback to legacy build
    let getDocument: any;
    try {
      const pdfjsLib = await import("pdfjs-dist");
      getDocument = pdfjsLib.getDocument;
    } catch (e) {
      // Fallback to legacy build path
      const pdfjsModule = await import("pdfjs-dist/legacy/build/pdf.mjs");
      getDocument = pdfjsModule.getDocument || (pdfjsModule as any).default?.getDocument;
    }
    
    if (!getDocument || typeof getDocument !== 'function') {
      throw new Error("Could not find getDocument function in pdfjs-dist module");
    }
    
    // Convert Buffer to Uint8Array for pdfjs-dist
    const uint8Array = new Uint8Array(buffer);
    
    // Load the PDF document
    const pdfDoc = await getDocument({ data: uint8Array }).promise;
    
    let fullText = "";
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }
    
    return fullText.trim();
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
