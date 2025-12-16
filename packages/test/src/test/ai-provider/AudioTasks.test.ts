/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AiJob,
  type AiJobInput,
  AudioClassification,
  getGlobalModelRepository,
  InMemoryModelRepository,
  setGlobalModelRepository,
  TextToAudio,
} from "@workglow/ai";
import {
  HF_TRANSFORMERS_ONNX,
  type HfTransformersOnnxModelRecord,
  register_HFT_InlineJobFns,
  register_TFMP_InlineJobFns,
  TENSORFLOW_MEDIAPIPE,
  type TFMPModelRecord,
} from "@workglow/ai-provider";
import { ConcurrencyLimiter, JobQueueClient, JobQueueServer } from "@workglow/job-queue";
import { InMemoryQueueStorage } from "@workglow/storage";
import {
  getTaskQueueRegistry,
  setTaskQueueRegistry,
  type TaskInput,
  type TaskOutput,
} from "@workglow/task-graph";
import { beforeEach, describe, expect, it } from "vitest";

// Test audio (silent 1 second WAV, base64 encoded - simplified)
const TEST_AUDIO_BASE64 =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQAAAAA=";

describe("Audio Tasks - HuggingFace Transformers", () => {
  beforeEach(() => {
    setTaskQueueRegistry(null);
  });

  describe("AudioClassificationTask", () => {
    it("should classify audio using HFT", async () => {
      const queueRegistry = getTaskQueueRegistry();
      const storage = new InMemoryQueueStorage<AiJobInput<TaskInput>, TaskOutput>(
        HF_TRANSFORMERS_ONNX
      );
      await storage.setupDatabase();

      const server = new JobQueueServer<AiJobInput<TaskInput>, TaskOutput>(AiJob, {
        storage,
        queueName: HF_TRANSFORMERS_ONNX,
        limiter: new ConcurrencyLimiter(1, 10),
        pollIntervalMs: 1,
      });

      const client = new JobQueueClient<AiJobInput<TaskInput>, TaskOutput>({
        storage,
        queueName: HF_TRANSFORMERS_ONNX,
      });

      client.attach(server);
      await register_HFT_InlineJobFns(client);
      queueRegistry.registerQueue({ server, client, storage });

      const model: HfTransformersOnnxModelRecord = {
        model_id: "onnx:Xenova/wav2vec2-base-960h:q8",
        title: "Wav2Vec2 Base 960h",
        description: "Audio classification model",
        tasks: ["AudioClassificationTask"],
        provider: HF_TRANSFORMERS_ONNX,
        providerConfig: {
          pipeline: "audio-classification",
          modelPath: "Xenova/wav2vec2-base-960h",
        },
        metadata: {},
      };

      setGlobalModelRepository(new InMemoryModelRepository());
      await getGlobalModelRepository().addModel(model);

      await server.start();

      const result = await AudioClassification({
        audio: TEST_AUDIO_BASE64,
        model: model.model_id,
        maxCategories: 5,
      });

      expect(result).toBeDefined();
      expect(result.categories).toBeDefined();
      expect(Array.isArray(result.categories)).toBe(true);

      await server.stop();
    }, 30000);

    it("should use zero-shot classification when categories are provided", async () => {
      const queueRegistry = getTaskQueueRegistry();
      const storage = new InMemoryQueueStorage<AiJobInput<TaskInput>, TaskOutput>(
        HF_TRANSFORMERS_ONNX
      );
      await storage.setupDatabase();

      const server = new JobQueueServer<AiJobInput<TaskInput>, TaskOutput>(AiJob, {
        storage,
        queueName: HF_TRANSFORMERS_ONNX,
        limiter: new ConcurrencyLimiter(1, 10),
        pollIntervalMs: 1,
      });

      const client = new JobQueueClient<AiJobInput<TaskInput>, TaskOutput>({
        storage,
        queueName: HF_TRANSFORMERS_ONNX,
      });

      client.attach(server);
      await register_HFT_InlineJobFns(client);
      queueRegistry.registerQueue({ server, client, storage });

      const model: HfTransformersOnnxModelRecord = {
        model_id: "onnx:Xenova/clap-htsat-unfused:q8",
        title: "CLAP HTSAT",
        description: "Zero-shot audio classification model",
        tasks: ["AudioClassificationTask"],
        provider: HF_TRANSFORMERS_ONNX,
        providerConfig: {
          pipeline: "zero-shot-audio-classification",
          modelPath: "Xenova/clap-htsat-unfused",
        },
        metadata: {},
      };

      setGlobalModelRepository(new InMemoryModelRepository());
      await getGlobalModelRepository().addModel(model);

      await server.start();

      const result = await AudioClassification({
        audio: TEST_AUDIO_BASE64,
        model: model.model_id,
        categories: ["speech", "music", "noise"],
      });

      expect(result).toBeDefined();
      expect(result.categories).toBeDefined();
      expect(Array.isArray(result.categories)).toBe(true);
      expect(result.categories.length).toBeGreaterThan(0);

      await server.stop();
    }, 30000);
  });

  describe("TextToAudioTask", () => {
    it("should generate audio from text using HFT", async () => {
      const queueRegistry = getTaskQueueRegistry();
      const storage = new InMemoryQueueStorage<AiJobInput<TaskInput>, TaskOutput>(
        HF_TRANSFORMERS_ONNX
      );
      await storage.setupDatabase();

      const server = new JobQueueServer<AiJobInput<TaskInput>, TaskOutput>(AiJob, {
        storage,
        queueName: HF_TRANSFORMERS_ONNX,
        limiter: new ConcurrencyLimiter(1, 10),
        pollIntervalMs: 1,
      });

      const client = new JobQueueClient<AiJobInput<TaskInput>, TaskOutput>({
        storage,
        queueName: HF_TRANSFORMERS_ONNX,
      });

      client.attach(server);
      await register_HFT_InlineJobFns(client);
      queueRegistry.registerQueue({ server, client, storage });

      const model: HfTransformersOnnxModelRecord = {
        model_id: "onnx:Xenova/speecht5_tts:q8",
        title: "SpeechT5 TTS",
        description: "Text to speech model",
        tasks: ["TextToAudioTask"],
        provider: HF_TRANSFORMERS_ONNX,
        providerConfig: {
          pipeline: "text-to-speech",
          modelPath: "Xenova/speecht5_tts",
        },
        metadata: {},
      };

      setGlobalModelRepository(new InMemoryModelRepository());
      await getGlobalModelRepository().addModel(model);

      await server.start();

      const result = await TextToAudio({
        text: "Hello world",
        model: model.model_id,
        speakerEmbeddings:
          "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings/cmu_us_slt_arctic-wav-arctic_a0005.bin",
      });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      const audioResult = Array.isArray(result.result) ? result.result[0] : result.result;
      expect(audioResult.audio).toBeDefined();
      expect(typeof audioResult.audio).toBe("string");
      expect(audioResult.samplingRate).toBeDefined();
      expect(typeof audioResult.samplingRate).toBe("number");

      await server.stop();
    }, 30000);
  });
});

describe("Audio Tasks - MediaPipe", () => {
  beforeEach(() => {
    setTaskQueueRegistry(null);
  });

  describe("AudioClassificationTask", () => {
    it("should classify audio using TFMP", async () => {
      const queueRegistry = getTaskQueueRegistry();
      const storage = new InMemoryQueueStorage<AiJobInput<TaskInput>, TaskOutput>(
        TENSORFLOW_MEDIAPIPE
      );
      await storage.setupDatabase();

      const server = new JobQueueServer<AiJobInput<TaskInput>, TaskOutput>(AiJob, {
        storage,
        queueName: TENSORFLOW_MEDIAPIPE,
        limiter: new ConcurrencyLimiter(1, 10),
        pollIntervalMs: 1,
      });

      const client = new JobQueueClient<AiJobInput<TaskInput>, TaskOutput>({
        storage,
        queueName: TENSORFLOW_MEDIAPIPE,
      });

      client.attach(server);
      await register_TFMP_InlineJobFns(client);
      queueRegistry.registerQueue({ server, client, storage });

      const model: TFMPModelRecord = {
        model_id: "tfmp:yamnet:f32",
        title: "YAMNet",
        description: "Audio classification model",
        tasks: ["AudioClassificationTask"],
        provider: TENSORFLOW_MEDIAPIPE,
        providerConfig: {
          taskEngine: "audio",
          pipeline: "audio-classifier",
          modelPath:
            "https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite",
        },
        metadata: {},
      };

      setGlobalModelRepository(new InMemoryModelRepository());
      await getGlobalModelRepository().addModel(model);

      await server.start();

      const result = await AudioClassification({
        audio: TEST_AUDIO_BASE64,
        model: model.model_id,
        maxCategories: 5,
      });

      expect(result).toBeDefined();
      expect(result.categories).toBeDefined();
      expect(Array.isArray(result.categories)).toBe(true);

      await server.stop();
    }, 30000);
  });
});
