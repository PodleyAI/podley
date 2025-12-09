import { getGlobalModelRepository } from "@workglow/ai";
import { TENSORFLOW_MEDIAPIPE } from "@workglow/ai-provider";

export async function registerMediaPipeTfJsLocalModels(): Promise<void> {
  await getGlobalModelRepository().addModel({
    model_id: "media-pipe:Universal Sentence Encoder",
    title: "Universal Sentence Encoder",
    description: "Universal Sentence Encoder",
    tasks: ["TextEmbeddingTask"],
    provider: TENSORFLOW_MEDIAPIPE,
    providerConfig: {
      modelPath:
        "https://storage.googleapis.com/mediapipe-tasks/text_embedder/universal_sentence_encoder.tflite",
    },
    metadata: {},
  });

  await getGlobalModelRepository().addModel({
    model_id: "media-pipe:Text Encoder",
    title: "Text Encoder",
    description: "Text Encoder",
    tasks: ["TextEmbeddingTask"],
    provider: TENSORFLOW_MEDIAPIPE,
    providerConfig: {
      modelPath:
        "https://huggingface.co/keras-sd/text-encoder-tflite/resolve/main/text_encoder.tflite?download=true",
    },
    metadata: {},
  });
}
