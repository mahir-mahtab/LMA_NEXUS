import { PDFParse } from 'pdf-parse';

export interface ParsedPdfResult {
  text: string;
  numPages: number;
  info?: {
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

/**
 * Parse PDF buffer and extract text content
 * @param buffer - PDF file buffer
 * @returns Extracted text and metadata
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedPdfResult> {
  try {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();
    
    return {
      text: textResult.text,
      numPages: textResult.total,
      info: {
        title: infoResult.info?.Title,
        author: infoResult.info?.Author,
        creator: infoResult.info?.Creator,
        producer: infoResult.info?.Producer,
        creationDate: infoResult.info?.CreationDate ? new Date(infoResult.info.CreationDate) : undefined,
        modificationDate: infoResult.info?.ModDate ? new Date(infoResult.info.ModDate) : undefined,
      },
    };
  } catch (error: any) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Extract text from a PDF file for clause parsing
 * @param buffer - PDF file buffer
 * @returns Extracted text content
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const result = await parsePdfBuffer(buffer);
  return result.text;
}
