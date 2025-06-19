/**
 * PDF Compression Service
 * 
 * This service interfaces with the PDF compression Web Worker to handle
 * compression operations in a background thread, providing progress updates
 * and a clean API for the main application.
 */

import { PDFCompressionOptions, CompressionResult, ProgressCallback } from '../types/compression';

// Use dynamic import for the worker to ensure it's properly bundled
// This creates a new worker instance each time it's needed
const createWorker = () => new Worker(new URL('../workers/pdfCompression.worker.js', import.meta.url), { type: 'module' });

/**
 * Compresses a PDF file using the specified options
 * 
 * @param file - The PDF file to compress
 * @param options - Compression options (quality, level, etc.)
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to compression result with file and stats
 */
export const compressPDF = (
  file: File,
  options: PDFCompressionOptions,
  onProgress?: ProgressCallback
): Promise<CompressionResult> => {
  return new Promise((resolve, reject) => {
    // Create a new worker instance
    const worker = createWorker();
    
    // Set up message handler
    worker.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'progress':
          // Call progress callback if provided
          if (onProgress) {
            onProgress(data.progress, data.message);
          }
          break;
          
        case 'complete':
          // Resolve the promise with compression results
          resolve({
            compressedFile: data.compressedFile,
            originalSize: data.originalSize,
            compressedSize: data.compressedSize,
            compressionRatio: data.compressionRatio,
          });
          
          // Clean up the worker
          worker.terminate();
          break;
          
        case 'error':
          // Reject the promise with the error
          reject(new Error(data.message));
          
          // Clean up the worker
          worker.terminate();
          break;
      }
    };
    
    // Handle worker errors
    worker.onerror = (error) => {
      reject(new Error(`Worker error: ${error.message}`));
      worker.terminate();
    };
    
    // Start the compression by sending the file and options to the worker
    worker.postMessage({
      file,
      options,
    });
  });
};

/**
 * Creates a cancelable compression operation
 * 
 * @param file - The PDF file to compress
 * @param options - Compression options
 * @param onProgress - Optional progress callback
 * @returns An object with the promise and a cancel function
 */
export const createCancelableCompression = (
  file: File,
  options: PDFCompressionOptions,
  onProgress?: ProgressCallback
) => {
  let worker: Worker | null = createWorker();
  
  const compressionPromise = new Promise<CompressionResult>((resolve, reject) => {
    if (!worker) {
      reject(new Error('Compression was canceled'));
      return;
    }
    
    // Set up message handler
    worker.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'progress':
          if (onProgress) {
            onProgress(data.progress, data.message);
          }
          break;
          
        case 'complete':
          resolve({
            compressedFile: data.compressedFile,
            originalSize: data.originalSize,
            compressedSize: data.compressedSize,
            compressionRatio: data.compressionRatio,
          });
          
          // Clean up
          if (worker) {
            worker.terminate();
            worker = null;
          }
          break;
          
        case 'error':
          reject(new Error(data.message));
          
          // Clean up
          if (worker) {
            worker.terminate();
            worker = null;
          }
          break;
      }
    };
    
    // Handle worker errors
    worker.onerror = (error) => {
      reject(new Error(`Worker error: ${error.message}`));
      
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };
    
    // Start compression
    worker.postMessage({
      file,
      options,
    });
  });
  
  // Function to cancel the compression
  const cancel = () => {
    if (worker) {
      worker.terminate();
      worker = null;
    }
  };
  
  return {
    promise: compressionPromise,
    cancel,
  };
};

/**
 * Estimates the compressed file size based on compression options
 * This is useful for providing a quick estimate before actual compression
 * 
 * @param fileSize - Original file size in bytes
 * @param options - Compression options
 * @returns Estimated compressed size in bytes
 */
export const estimateCompressedSize = (
  fileSize: number,
  options: PDFCompressionOptions
): number => {
  let compressionFactor: number;
  
  // Estimate compression factor based on level
  switch (options.compressionLevel) {
    case 'low':
      compressionFactor = 0.85; // ~15% reduction
      break;
    case 'medium':
      compressionFactor = 0.65; // ~35% reduction
      break;
    case 'high':
      // If preserving quality, compression is less aggressive
      compressionFactor = options.preserveQuality ? 0.5 : 0.3; // 50-70% reduction
      break;
    default:
      compressionFactor = 0.7; // Default to medium
  }
  
  // Adjust based on quality setting (0-100)
  // Lower quality = better compression
  const qualityFactor = 1 - ((100 - options.quality) / 200); // Range: 0.5-1.0
  
  // Calculate estimated size
  return Math.floor(fileSize * compressionFactor * qualityFactor);
};
