/**
 * Document parsing service.
 * Extracts text content from uploaded files (TXT, PDF, DOCX).
 */

export interface ParseResult {
  content: string;
  pageCount?: number;
}

/**
 * Parse a text file.
 */
export function parseTxt(buffer: Buffer): ParseResult {
  const content = buffer.toString("utf-8");
  return { content };
}

/**
 * Parse a PDF file.
 * Uses a simple regex-based extraction since we can't use native modules in edge runtime.
 * For production, consider using a dedicated PDF parsing library.
 */
export function parsePdf(buffer: Buffer): ParseResult {
  // Simple text extraction from PDF
  // This works for text-based PDFs but not for scanned documents
  const text = buffer.toString("utf-8");

  // Extract text between stream markers
  const textChunks: string[] = [];
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;

  while ((match = streamRegex.exec(text)) !== null) {
    const streamContent = match[1];
    // Extract readable text (remove binary data)
    const readableText = streamContent
      .replace(/[^\x20-\x7E\n\r]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (readableText.length > 10) {
      textChunks.push(readableText);
    }
  }

  const content = textChunks.join("\n\n");

  // If no content extracted, try a simpler approach
  if (content.length < 50) {
    const simpleText = text
      .replace(/[^\x20-\x7E\n\r]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      content: simpleText.substring(0, 100000), // Limit to 100KB
      pageCount: undefined,
    };
  }

  return { content };
}

/**
 * Parse a DOCX file.
 * DOCX files are ZIP archives containing XML.
 */
export function parseDocx(buffer: Buffer): ParseResult {
  // DOCX is a ZIP file, we need to extract word/document.xml
  // For simplicity, we'll use a regex-based approach on the raw XML
  const text = buffer.toString("utf-8");

  // Extract text from XML tags
  const xmlContent = text
    .replace(/<[^>]+>/g, " ") // Remove XML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#\d+;/g, "") // Remove numeric entities
    .replace(/\s+/g, " ")
    .trim();

  return { content: xmlContent.substring(0, 100000) };
}

/**
 * Parse a document based on its type.
 */
export function parseDocument(
  buffer: Buffer,
  fileType: string
): ParseResult {
  const lowerType = fileType.toLowerCase();

  if (lowerType.includes("pdf")) {
    return parsePdf(buffer);
  }

  if (lowerType.includes("word") || lowerType.includes("docx")) {
    return parseDocx(buffer);
  }

  if (lowerType.includes("text") || lowerType.includes("plain")) {
    return parseTxt(buffer);
  }

  // Default: try as text
  return parseTxt(buffer);
}

/**
 * Chunk text into smaller pieces for RAG.
 */
export function chunkText(text: string, maxChunkSize = 1000): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += sentence + " ";
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
