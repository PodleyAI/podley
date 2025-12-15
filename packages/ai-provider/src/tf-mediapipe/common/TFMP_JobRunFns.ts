/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FilesetResolver,
  LanguageDetector,
  TextClassifier,
  TextEmbedder,
} from "@mediapipe/tasks-text";
import type {
  AiProviderRunFn,
  DownloadModelTaskExecuteInput,
  DownloadModelTaskExecuteOutput,
  TextClassificationTaskExecuteInput,
  TextClassificationTaskExecuteOutput,
  TextEmbeddingTaskExecuteInput,
  TextEmbeddingTaskExecuteOutput,
  TextLanguageDetectionTaskExecuteInput,
  TextLanguageDetectionTaskExecuteOutput,
  UnloadModelTaskExecuteInput,
  UnloadModelTaskExecuteOutput,
} from "@workglow/ai";
import { PermanentJobError } from "@workglow/job-queue";
import { TFMPModelRecord } from "./TFMP_ModelSchema";

interface TFMPWasmFileset {
  /** The path to the Wasm loader script. */
  wasmLoaderPath: string;
  /** The path to the Wasm binary. */
  wasmBinaryPath: string;
  /** The optional path to the asset loader script. */
  assetLoaderPath?: string;
  /** The optional path to the assets binary. */
  assetBinaryPath?: string;
}

/**
 * Cache for WASM filesets by task engine (text, audio, vision, genai).
 * Multiple models may share the same WASM fileset.
 */
const wasm_tasks = new Map<string, TFMPWasmFileset>();

/**
 * Reference counts tracking how many models are using each WASM fileset.
 * When count reaches 0, the WASM fileset can be safely unloaded.
 */
const wasm_reference_counts = new Map<string, number>();

/**
 * Maps model paths to their corresponding task engine.
 * Used to determine which WASM fileset to decrement when a model is unloaded.
 */
const model_to_wasm_mapping = new Map<string, string>();

/**
 * Helper function to get a WASM task for a model
 */
const getWasmTask = async (
  model: TFMPModelRecord,
  onProgress: (progress: number, message?: string, details?: any) => void,
  signal: AbortSignal
): Promise<TFMPWasmFileset> => {
  const taskEngine = model.providerConfig.taskEngine;

  if (wasm_tasks.has(taskEngine)) {
    return wasm_tasks.get(taskEngine)!;
  }

  if (signal.aborted) {
    throw new PermanentJobError("Aborted job");
  }

  onProgress(0.1, "Loading WASM task");

  let wasmFileset: TFMPWasmFileset;

  switch (taskEngine) {
    case "text":
      wasmFileset = await FilesetResolver.forTextTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm"
      );
      break;
    case "audio":
      wasmFileset = await FilesetResolver.forAudioTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@latest/wasm"
      );
      break;
    case "vision":
      wasmFileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      break;
    case "genai":
      wasmFileset = await FilesetResolver.forGenAiTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm"
      );
      break;
    default:
      throw new PermanentJobError("Invalid task engine");
  }

  wasm_tasks.set(taskEngine, wasmFileset);
  return wasmFileset;
};

interface CachedModelTask {
  readonly task: TextEmbedder | TextClassifier | LanguageDetector;
  readonly options: Record<string, unknown>;
  readonly taskEngine: string;
}

const modelTaskCache = new Map<string, CachedModelTask[]>();

type InferTaskInstance<T> = T extends typeof TextEmbedder
  ? TextEmbedder
  : T extends typeof TextClassifier
    ? TextClassifier
    : T extends typeof LanguageDetector
      ? LanguageDetector
      : never;

/**
 * Checks if two option objects are deeply equal.
 */
const optionsMatch = (opts1: Record<string, unknown>, opts2: Record<string, unknown>): boolean => {
  const keys1 = Object.keys(opts1).sort();
  const keys2 = Object.keys(opts2).sort();

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => {
    const val1 = opts1[key];
    const val2 = opts2[key];

    if (Array.isArray(val1) && Array.isArray(val2)) {
      return JSON.stringify(val1) === JSON.stringify(val2);
    }

    return val1 === val2;
  });
};

const getModelTask = async <
  T extends typeof TextEmbedder | typeof TextClassifier | typeof LanguageDetector,
>(
  model: TFMPModelRecord,
  options: Record<string, unknown>,
  onProgress: (progress: number, message?: string, details?: any) => void,
  signal: AbortSignal,
  TaskType: T
): Promise<InferTaskInstance<T>> => {
  const modelPath = model.providerConfig.modelPath;
  const taskEngine = model.providerConfig.taskEngine;

  // Check if we have a cached instance with matching options
  const cachedTasks = modelTaskCache.get(modelPath);
  if (cachedTasks) {
    const matchedTask = cachedTasks.find((cached) => optionsMatch(cached.options, options));
    if (matchedTask) {
      return matchedTask.task as InferTaskInstance<T>;
    }
  }

  // Load WASM if needed
  const wasmFileset = await getWasmTask(model, onProgress, signal);

  onProgress(0.2, "Creating model task");

  // Create new model instance
  const task = await TaskType.createFromOptions(wasmFileset, {
    baseOptions: {
      modelAssetPath: modelPath,
    },
    ...options,
  });

  // Cache the task with its options and task engine
  const cachedTask: CachedModelTask = { task, options, taskEngine };
  if (!modelTaskCache.has(modelPath)) {
    modelTaskCache.set(modelPath, []);
  }
  modelTaskCache.get(modelPath)!.push(cachedTask);

  // Increment WASM reference count for this cached task
  wasm_reference_counts.set(taskEngine, (wasm_reference_counts.get(taskEngine) || 0) + 1);

  return task as any;
};

const getTextEmbedder = async (
  model: TFMPModelRecord,
  options: Record<string, unknown>,
  onProgress: (progress: number, message?: string, details?: any) => void,
  signal: AbortSignal
): Promise<TextEmbedder> => {
  return getModelTask(model, options, onProgress, signal, TextEmbedder);
};

const getTextClassifer = async (
  model: TFMPModelRecord,
  options: Record<string, unknown>,
  onProgress: (progress: number, message?: string, details?: any) => void,
  signal: AbortSignal
): Promise<TextClassifier> => {
  return getModelTask(model, options, onProgress, signal, TextClassifier);
};

const getTextLanguageDetector = async (
  model: TFMPModelRecord,
  options: Record<string, unknown>,
  onProgress: (progress: number, message?: string, details?: any) => void,
  signal: AbortSignal
): Promise<LanguageDetector> => {
  return getModelTask(model, options, onProgress, signal, LanguageDetector);
};

/**
 * Core implementation for downloading and caching a MediaPipe TFJS model.
 * This is shared between inline and worker implementations.
 */
export const TFMP_Download: AiProviderRunFn<
  DownloadModelTaskExecuteInput,
  DownloadModelTaskExecuteOutput,
  TFMPModelRecord
> = async (input, model, onProgress, signal) => {
  let task: TextEmbedder | TextClassifier | LanguageDetector;
  switch (model?.providerConfig.pipeline) {
    case "text-embedder":
      task = await getTextEmbedder(model, {}, onProgress, signal);
      break;
    case "text-classifier":
      task = await getTextClassifer(model, {}, onProgress, signal);
      break;
    case "text-language-detector":
      task = await getTextLanguageDetector(model, {}, onProgress, signal);
      break;
    default:
      throw new PermanentJobError("Invalid pipeline");
  }
  onProgress(0.9, "Pipeline loaded");
  task.close(); // Close the task to release the resources, but it is still in the browser cache
  // Decrease reference count for WASM fileset for this cached task since this is a fake model cache entry
  const taskEngine = model?.providerConfig.taskEngine;
  wasm_reference_counts.set(taskEngine, wasm_reference_counts.get(taskEngine)! - 1);

  return {
    model: input.model,
  };
};

/**
 * Core implementation for text embedding using MediaPipe TFJS.
 * This is shared between inline and worker implementations.
 */
export const TFMP_TextEmbedding: AiProviderRunFn<
  TextEmbeddingTaskExecuteInput,
  TextEmbeddingTaskExecuteOutput,
  TFMPModelRecord
> = async (input, model, onProgress, signal) => {
  const textEmbedder = await getTextEmbedder(model!, {}, onProgress, signal);
  const result = textEmbedder.embed(input.text);

  if (!result.embeddings?.[0]?.floatEmbedding) {
    throw new PermanentJobError("Failed to generate embedding: Empty result");
  }

  const embedding = Float32Array.from(result.embeddings[0].floatEmbedding);

  return {
    vector: embedding,
  };
};

/**
 * Core implementation for text classification using MediaPipe TFJS.
 * This is shared between inline and worker implementations.
 */
export const TFMP_TextClassification: AiProviderRunFn<
  TextClassificationTaskExecuteInput,
  TextClassificationTaskExecuteOutput,
  TFMPModelRecord
> = async (input, model, onProgress, signal) => {
  const TextClassification = await getTextClassifer(
    model!,
    {
      maxCategories: input.maxCategories,
      // scoreThreshold: input.scoreThreshold,
      // allowList: input.allowList,
      // blockList: input.blockList,
    },
    onProgress,
    signal
  );
  const result = TextClassification.classify(input.text);

  if (!result.classifications?.[0]?.categories) {
    throw new PermanentJobError("Failed to classify text: Empty result");
  }

  const categories = result.classifications[0].categories.map((category) => ({
    label: category.categoryName,
    score: category.score,
  }));

  return {
    categories,
  };
};

/**
 * Core implementation for language detection using MediaPipe TFJS.
 * This is shared between inline and worker implementations.
 */
export const TFMP_TextLanguageDetection: AiProviderRunFn<
  TextLanguageDetectionTaskExecuteInput,
  TextLanguageDetectionTaskExecuteOutput,
  TFMPModelRecord
> = async (input, model, onProgress, signal) => {
  const maxLanguages = input.maxLanguages === 0 ? -1 : input.maxLanguages;

  const textLanguageDetector = await getTextLanguageDetector(
    model!,
    {
      maxLanguages,
      // scoreThreshold: input.scoreThreshold,
      // allowList: input.allowList,
      // blockList: input.blockList,
    },
    onProgress,
    signal
  );
  const result = textLanguageDetector.detect(input.text);

  if (!result.languages?.[0]?.languageCode) {
    throw new PermanentJobError("Failed to detect language: Empty result");
  }

  const languages = result.languages.map((language) => ({
    language: language.languageCode,
    score: language.probability,
  }));

  return {
    languages,
  };
};

/**
 * Core implementation for unloading a MediaPipe TFJS model.
 * This is shared between inline and worker implementations.
 *
 * When a model is unloaded, this function:
 * 1. Disposes of all cached model instances for the given model path
 * 2. Decrements the reference count for the associated WASM fileset for each instance
 * 3. If no other models are using the WASM fileset (count reaches 0), unloads the WASM
 */
export const TFMP_Unload: AiProviderRunFn<
  UnloadModelTaskExecuteInput,
  UnloadModelTaskExecuteOutput,
  TFMPModelRecord
> = async (input, model, onProgress, signal) => {
  const modelPath = model!.providerConfig.modelPath;

  // Dispose of all cached model tasks if they exist
  if (modelTaskCache.has(modelPath)) {
    const cachedTasks = modelTaskCache.get(modelPath)!;

    for (const cachedTask of cachedTasks) {
      const task = cachedTask.task;
      task.close();

      // Decrease reference count for WASM fileset for this cached task
      const taskEngine = cachedTask.taskEngine;
      const currentCount = wasm_reference_counts.get(taskEngine) || 0;
      const newCount = currentCount - 1;

      if (newCount <= 0) {
        // No more models using this WASM fileset, unload it
        wasm_tasks.delete(taskEngine);
        wasm_reference_counts.delete(taskEngine);
      } else {
        wasm_reference_counts.set(taskEngine, newCount);
      }
    }

    modelTaskCache.delete(modelPath);
  }

  return {
    model: input.model,
  };
};
