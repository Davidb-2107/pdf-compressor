/**
 * PDF Compression Types
 * 
 * Type definitions for the PDF compression service, including
 * options, results, and callback interfaces.
 */

/**
 * Compression level options
 */
export type CompressionLevel = 'low' | 'medium' | 'high';

/**
 * Options for PDF compression
 */
export interface PDFCompressionOptions {
  /**
   * Quality level (0-100)
   * Higher values preserve more quality but result in larger files
   */
  quality: number;
  
  /**
   * Compression level preset
   * - low: Minimal compression, best quality
   * - medium: Balanced compression and quality
   * - high: Maximum compression, may affect quality
   */
  compressionLevel: CompressionLevel;
  
  /**
   * Whether to preserve text quality during compression
   * When true, text will remain sharp even at high compression levels
   */
  preserveQuality: boolean;
}

/**
 * Result of a PDF compression operation
 */
export interface CompressionResult {
  /**
   * The compressed PDF file as a Blob
   */
  compressedFile: Blob;
  
  /**
   * Size of the original file in bytes
   */
  originalSize: number;
  
  /**
   * Size of the compressed file in bytes
   */
  compressedSize: number;
  
  /**
   * Compression ratio (0-1)
   * 0.5 means the file was reduced by 50%
   */
  compressionRatio: number;
}

/**
 * Progress callback function type
 * @param progress - Current progress (0-100)
 * @param message - Optional status message
 */
export type ProgressCallback = (progress: number, message?: string) => void;

/**
 * Error that can occur during compression
 */
export interface CompressionError extends Error {
  /**
   * Error code for specific error types
   */
  code?: string;
  
  /**
   * Whether the error is recoverable
   */
  recoverable?: boolean;
}

/**
 * Cancelable compression operation
 */
export interface CancelableCompression {
  /**
   * Promise that resolves to the compression result
   */
  promise: Promise<CompressionResult>;
  
  /**
   * Function to cancel the compression operation
   */
  cancel: () => void;
}

/**
 * --- Worker message payloads -------------------------------------------------
 * The compression Web Worker posts structured messages back to the main thread.
 * Defining the payload shapes here keeps `pdfCompressionService.ts` and other
 * consumers fully typed without duplicating literal string unions everywhere.
 */

/**
 * Progress message payload
 */
export interface WorkerProgressMessage {
  type: 'progress';
  data: {
    /**
     * Current progress (0-100)
     */
    progress: number;
    /**
     * Optional human-readable status (e.g. "Optimising images …")
     */
    message?: string;
  };
}

/**
 * Completion message payload
 */
export interface WorkerCompleteMessage {
  type: 'complete';
  data: CompressionResult;
}

/**
 * Error message payload
 */
export interface WorkerErrorMessage {
  type: 'error';
  data: {
    /**
     * User-friendly error description
     */
    message: string;
  };
}

/**
 * Union of all message variants the worker can emit
 */
export type WorkerMessage =
  | WorkerProgressMessage
  | WorkerCompleteMessage
  | WorkerErrorMessage;
