//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken, globalServiceRegistry } from "../di";
import { Worker, parentPort } from "@ellmers/util";

/**
 * Extracts transferables from an object.
 * @param obj - The object to extract transferables from.
 * @returns An array of transferables.
 */
function extractTransferables(obj: any) {
  const transferables: Transferable[] = [];

  function findTransferables(value: any) {
    if (value instanceof Float32Array || value instanceof Int16Array) {
      transferables.push(value.buffer);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(findTransferables);
    }
  }

  findTransferables(obj);
  return transferables;
}

/**
 * WorkerServer is a class that handles messages from the main thread to the worker.
 * It is used to register functions that can be called from the main thread.
 * It also handles the transfer of transferables to the main thread.
 */
export class WorkerServer {
  constructor() {
    parentPort.addEventListener("message", async (event) => {
      await this.handleMessage(event);
    });
  }

  private functions: Record<string, (...args: any[]) => Promise<any>> = {};

  private postResult = (id: string, result: any) => {
    const transferables = extractTransferables(result);
    // @ts-ignore - Ignore type mismatch between standard Transferable and Bun.Transferable
    postMessage({ id, type: "complete", data: result }, transferables);
  };

  private postError = (id: string, errorMessage: string) => {
    postMessage({ id, type: "error", data: errorMessage });
  };

  // Keep track of each request’s AbortController
  private requestControllers = new Map<string, AbortController>();

  registerFunction(name: string, fn: (...args: any[]) => Promise<any>) {
    this.functions[name] = fn;
  }

  // Handle messages from the main thread
  async handleMessage(event: MessageEvent) {
    const { id, type, functionName, args } = event.data;
    if (type === "abort") {
      return await this.handleAbort(id);
    }
    if (type === "call") {
      return await this.handleCall(id, functionName, args);
    }
  }

  async handleAbort(id: string) {
    if (this.requestControllers.has(id)) {
      this.requestControllers.get(id)?.abort();
    }
  }

  async handleCall(id: string, functionName: string, [input, model]: [any, any]) {
    if (!(functionName in this.functions)) {
      this.postError(id, `Function ${functionName} not found`);
      return;
    }

    try {
      const abortController = new AbortController();
      this.requestControllers.set(id, abortController);

      const fn = this.functions[functionName];
      const postProgress = (progress: number, message?: string, details?: any) => {
        postMessage({ id, type: "progress", data: { progress, message, details } });
      };
      const result = await fn(input, model, postProgress, abortController.signal);
      this.postResult(id, result);
    } catch (error: any) {
      this.postError(id, error.message);
    } finally {
      this.requestControllers.delete(id);
    }
  }
}

export const WORKER_SERVER = createServiceToken<WorkerServer>("worker.server");

globalServiceRegistry.register(WORKER_SERVER, () => new WorkerServer(), true);
