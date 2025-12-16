import { getGlobalModelRepository } from "@workglow/ai";
import { TENSORFLOW_MEDIAPIPE, type TFMPModelRecord } from "@workglow/ai-provider";

export async function registerMediaPipeTfJsLocalModels(): Promise<void> {
  const models: TFMPModelRecord[] = [
    // Text Models
    {
      model_id: "media-pipe:Universal Sentence Encoder",
      title: "Universal Sentence Encoder",
      description: "Universal Sentence Encoder",
      tasks: ["TextEmbeddingTask"],
      provider: TENSORFLOW_MEDIAPIPE,
      providerConfig: {
        taskEngine: "text",
        pipeline: "text-embedder",
        modelPath:
          "https://storage.googleapis.com/mediapipe-tasks/text_embedder/universal_sentence_encoder.tflite",
      },
      metadata: {},
    },
    {
      model_id: "media-pipe:BERT Text Classifier",
      title: "BERT Text Classifier",
      description: "BERT-based text classification model",
      tasks: ["TextClassificationTask"],
      provider: TENSORFLOW_MEDIAPIPE,
      providerConfig: {
        taskEngine: "text",
        pipeline: "text-classifier",
        modelPath:
          "https://storage.googleapis.com/mediapipe-models/text_classifier/bert_classifier/float32/1/bert_classifier.tflite",
      },
      metadata: {},
    },
    {
      model_id: "media-pipe:Language Detector",
      title: "Language Detector",
      description: "Language detection model",
      tasks: ["TextLanguageDetectionTask"],
      provider: TENSORFLOW_MEDIAPIPE,
      providerConfig: {
        taskEngine: "text",
        pipeline: "text-language-detector",
        modelPath:
          "https://storage.googleapis.com/mediapipe-models/language_detector/language_detector/float32/1/language_detector.tflite",
      },
      metadata: {},
    },
    // Vision Models
    {
      model_id: "media-pipe:EfficientNet Lite0 Image Classifier",
      title: "EfficientNet Lite0",
      description: "Lightweight image classification model",
      tasks: ["ImageClassificationTask"],
      provider: TENSORFLOW_MEDIAPIPE,
      providerConfig: {
        taskEngine: "vision",
        pipeline: "vision-image-classifier",
        modelPath:
          "https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/float32/1/efficientnet_lite0.tflite",
      },
      metadata: {},
    },
    {
      model_id: "media-pipe:MobileNet V3 Image Embedder",
      title: "MobileNet V3 Small",
      description: "Lightweight image embedding model",
      tasks: ["ImageEmbeddingTask"],
      provider: TENSORFLOW_MEDIAPIPE,
      providerConfig: {
        taskEngine: "vision",
        pipeline: "vision-image-embedder",
        modelPath:
          "https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite",
      },
      metadata: {},
    },
    {
      model_id: "media-pipe:EfficientDet Lite0 Object Detector",
      title: "EfficientDet Lite0",
      description: "Lightweight object detection model",
      tasks: ["ObjectDetectionTask"],
      provider: TENSORFLOW_MEDIAPIPE,
      providerConfig: {
        taskEngine: "vision",
        pipeline: "vision-object-detector",
        modelPath:
          "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite",
      },
      metadata: {},
    },
    {
      model_id: "media-pipe:DeepLab V3 Image Segmenter",
      title: "DeepLab V3",
      description: "Image segmentation model",
      tasks: ["ImageSegmentationTask"],
      provider: TENSORFLOW_MEDIAPIPE,
      providerConfig: {
        taskEngine: "vision",
        pipeline: "vision-image-segmenter",
        modelPath:
          "https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite",
      },
      metadata: {},
    },
    // Audio Models
    {
      model_id: "media-pipe:YAMNet Audio Classifier",
      title: "YAMNet",
      description: "Audio event classification model",
      tasks: ["AudioClassificationTask"],
      provider: TENSORFLOW_MEDIAPIPE,
      providerConfig: {
        taskEngine: "audio",
        pipeline: "audio-classifier",
        modelPath:
          "https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite",
      },
      metadata: {},
    },
  ];

  for (const model of models) {
    await getGlobalModelRepository().addModel(model);
  }
}
