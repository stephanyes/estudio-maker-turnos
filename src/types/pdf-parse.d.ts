declare module 'pdf-parse' {
  interface PDFInfo {
    PDFVersion?: string;
    isAcroFormPresent?: boolean;
    isXFAPresent?: boolean;
    numpages?: number;
    numrender?: number;
    info?: Record<string, any>;
    metadata?: Record<string, any>;
  }

  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, any>;
    metadata: any;
    version: string;
    text: string;
  }

  function pdf(dataBuffer: Buffer | Uint8Array, options?: any): Promise<PDFParseResult>;
  export = pdf;
}


