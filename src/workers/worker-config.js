/**
 * Web Worker Configuration for Create React App
 * 
 * This module provides utilities for working with Web Workers in a Create React App
 * environment, handling both development and production builds properly.
 */

/**
 * Creates a new Web Worker instance with proper URL resolution
 * 
 * @param {string} workerPath - Path to the worker script relative to src
 * @param {WorkerOptions} [options] - Worker options
 * @returns {Worker} - The created Worker instance
 */
export const createWorker = (workerPath, options = {}) => {
  // Use URL constructor with import.meta.url for proper resolution in both dev and prod
  const workerUrl = new URL(`../${workerPath}`, import.meta.url);
  
  return new Worker(workerUrl, { 
    type: 'module',  // Use module workers for better compatibility with CRA
    ...options 
  });
};

/**
 * Creates a worker with automatic termination when the component unmounts
 * Designed to be used with React's useEffect hook
 * 
 * @param {string} workerPath - Path to the worker script relative to src
 * @param {WorkerOptions} [options] - Worker options
 * @param {function} [onMessage] - Message handler function
 * @param {function} [onError] - Error handler function
 * @returns {[Worker, function]} - Worker instance and termination function
 * 
 * @example
 * useEffect(() => {
 *   const [worker, terminate] = createCleanupWorker(
 *     'workers/pdfCompression.worker.js',
 *     {},
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
export const createCleanupWorker = (workerPath, options = {}, onMessage = null, onError = null) => {
  const worker = createWorker(workerPath, options);
  
  if (onMessage) {
    worker.onmessage = onMessage;
  }
  
  if (onError) {
    worker.onerror = onError;
  }
  
  const terminate = () => {
    worker.terminate();
  };
  
  return [worker, terminate];
};

/**
 * Helper to determine if Web Workers are supported in the current browser
 * 
 * @returns {boolean} - True if Web Workers are supported
 */
export const isWorkerSupported = () => {
  return typeof Worker !== 'undefined';
};
