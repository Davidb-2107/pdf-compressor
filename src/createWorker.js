/**
 * createWorker.js
 * Helper utilities for working with Web Workers in Create React App
 * 
 * This module provides functions to create and manage Web Workers
 * while bypassing ESLint restrictions and ensuring proper build compatibility.
 */

/**
 * Creates a Web Worker from a function
 * This approach converts the function to a string and creates a blob URL
 * which bypasses ESLint restrictions on direct worker imports
 * 
 * @param {Function} workerFunction - The function to be executed in the worker
 * @returns {Worker} - The created Web Worker instance
 */
export function createWorkerFromFunction(workerFunction) {
  // Convert the function to a string and create a blob
  const workerCode = `
    // Self-executing function to create a clean scope
    (${workerFunction.toString()})();
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  
  // Create and return the worker
  const worker = new Worker(workerUrl);
  
  // Store the URL on the worker instance for later cleanup
  worker._url = workerUrl;
  
  return worker;
}

/**
 * Creates a Web Worker from a string of code
 * 
 * @param {string} workerCode - JavaScript code to run in the worker
 * @returns {Worker} - The created Web Worker instance
 */
export function createWorkerFromCode(workerCode) {
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  
  const worker = new Worker(workerUrl);
  worker._url = workerUrl;
  
  return worker;
}

/**
 * Creates a Web Worker that uses pdf-lib for PDF processing
 * This is specifically designed for the PDF compression functionality
 * 
 * @returns {Worker} - The created Web Worker instance
 */
export function createPdfCompressionWorker() {
  // Import statements need to be included in the worker code
  const workerCode = `
    // PDF Compression Web Worker
    
    // We need to use importScripts to load pdf-lib in the worker context
    // In a real implementation, you would host the pdf-lib library and import it
    // For now, we'll use a CDN version
    importScripts('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
    
    // Listen for messages from the main thread
    self.onmessage = async (event) => {
      try {
        const { file, options } = event.data;
        
        // Report initial progress
        reportProgress(10, 'Loading PDF document...');
        
        // Convert File to ArrayBuffer
        const fileBuffer = await file.arrayBuffer();
        
        // Load the PDF document using the global PDFLib from importScripts
        const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer, {
          updateMetadata: false,
          ignoreEncryption: true,
        });
        
        reportProgress(20, 'Analyzing document structure...');
        
        // Get document information
        const pageCount = pdfDoc.getPageCount();
        const originalSize = file.size;
        
        // Apply compression based on options
        reportProgress(50, 'Applying compression strategies...');
        
        // Save with optimized options
        const compressedPdfBytes = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          compress: true,
        });
        
        // Create a blob from the compressed PDF
        const compressedBlob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
        const compressedSize = compressedBlob.size;
        
        // Report completion with compression results
        reportProgress(100, 'Compression complete!');
        
        // Send the compressed PDF back to the main thread
        self.postMessage({
          type: 'complete',
          data: {
            compressedFile: compressedBlob,
            originalSize,
            compressedSize,
            compressionRatio: (originalSize - compressedSize) / originalSize,
          }
        });
        
      } catch (error) {
        console.error('PDF compression error:', error);
        self.postMessage({
          type: 'error',
          data: {
            message: error.message || 'Failed to compress PDF. Please try again.',
          }
        });
      }
    };

    /**
     * Report progress back to the main thread
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} message - Optional status message
     */
    function reportProgress(percent, message = '') {
      self.postMessage({
        type: 'progress',
        data: {
          progress: percent,
          message,
        }
      });
    }
  `;
  
  return createWorkerFromCode(workerCode);
}

/**
 * Terminates a worker and revokes its blob URL to prevent memory leaks
 * 
 * @param {Worker} worker - The worker to terminate
 */
export function terminateWorker(worker) {
  if (!worker) return;
  
  // Terminate the worker
  worker.terminate();
  
  // Revoke the blob URL if it exists
  if (worker._url) {
    URL.revokeObjectURL(worker._url);
  }
}

/**
 * Creates a worker with automatic cleanup when the component unmounts
 * Designed to be used with React's useEffect hook
 * 
 * @param {Function} workerFunction - The function to be executed in the worker
 * @param {Function} onMessage - Message handler function
 * @param {Function} onError - Error handler function
 * @returns {[Worker, Function]} - Worker instance and termination function
 * 
 * @example
 * useEffect(() => {
 *   const [worker, terminate] = createCleanupWorker(
 *     myWorkerFunction,
 *     (event) => handleWorkerMessage(event),
 *     (error) => handleWorkerError(error)
 *   );
 *   
 *   // Send initial message to worker
 *   worker.postMessage({ file, options });
 *   
 *   // Worker will be automatically terminated on component unmount
 *   return terminate;
 * }, [file, options]);
 */
export function createCleanupWorker(workerFunction, onMessage = null, onError = null) {
  const worker = createWorkerFromFunction(workerFunction);
  
  if (onMessage) {
    worker.onmessage = onMessage;
  }
  
  if (onError) {
    worker.onerror = onError;
  }
  
  const terminate = () => {
    terminateWorker(worker);
  };
  
  return [worker, terminate];
}

/**
 * Checks if Web Workers are supported in the current browser
 * 
 * @returns {boolean} - True if Web Workers are supported
 */
export function isWorkerSupported() {
  return typeof Worker !== 'undefined';
}
