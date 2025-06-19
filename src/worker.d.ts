// Type definitions for Web Workers

// Declare the module for worker files
declare module "*.worker.js" {
  // Export a constructor that returns a Worker instance
  const WorkerConstructor: {
    new (): Worker;
  };
  export default WorkerConstructor;
}

// Declare the module for Web Worker URLs
declare module "*.worker.js?url" {
  const workerUrl: string;
  export default workerUrl;
}

// Extend the global scope for Web Workers
declare global {
  // Make 'self' a valid reference in Web Worker contexts
  // This prevents ESLint errors with 'no-restricted-globals'
  const self: DedicatedWorkerGlobalScope;
  
  // Define the worker global scope interface
  interface DedicatedWorkerGlobalScope extends WorkerGlobalScope {
    postMessage(message: any, transfer?: Transferable[]): void;
    onmessage: ((this: Worker, ev: MessageEvent) => any) | null;
    onerror: ((this: Worker, ev: ErrorEvent) => any) | null;
  }

  // Define WorkerGlobalScope for completeness
  interface WorkerGlobalScope {
    self: WorkerGlobalScope;
    location: WorkerLocation;
    navigator: WorkerNavigator;
    importScripts(...urls: string[]): void;
  }
}

// Ensure this file is treated as a module
export {};
