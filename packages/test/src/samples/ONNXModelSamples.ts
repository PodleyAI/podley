import { getGlobalModelRepository } from "@workglow/ai";
import { HF_TRANSFORMERS_ONNX, HfTransformersOnnxModelRecord } from "@workglow/ai-provider";

export async function registerHuggingfaceLocalModels(): Promise<void> {
  const onnxModels: HfTransformersOnnxModelRecord[] = [
    {
      model_id: "onnx:Supabase/gte-small",
      title: "gte-small",
      description: "Supabase/gte-small",
      tasks: ["TextEmbeddingTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "feature-extraction",
        modelPath: "Supabase/gte-small",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/bge-base-en-v1.5",
      title: "bge-base-en-v1.5",
      description: "Xenova/bge-base-en-v1.5",
      tasks: ["TextEmbeddingTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "feature-extraction",
        modelPath: "Xenova/bge-base-en-v1.5",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/distilbert-base-uncased-distilled-squad",
      title: "distilbert-base-uncased-distilled-squad",
      description: "Xenova/distilbert-base-uncased-distilled-squad",
      tasks: ["TextQuestionAnsweringTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "question-answering",
        modelPath: "Xenova/distilbert-base-uncased-distilled-squad",
      },
      metadata: {},
    },
    {
      model_id: "onnx:answerdotai/ModernBERT-base",
      title: "ModernBERT-base",
      description: "answerdotai/ModernBERT-base",
      tasks: ["TextClassificationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "feature-extraction",
        modelPath: "Xenova/multi-qa-mpnet-base-dot-v1",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/gpt2",
      title: "gpt2",
      description: "Xenova/gpt2",
      tasks: ["TextGenerationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "text-generation",
        modelPath: "Xenova/gpt2",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/Phi-3-mini-4k-instruct:q4f16",
      title: "Phi-3-mini-4k-instruct:q4f16",
      description: "Xenova/Phi-3-mini-4k-instruct:q4f16",
      tasks: ["TextGenerationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "text-generation",
        modelPath: "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/distilgpt2",
      title: "distilgpt2",
      description: "Xenova/distilgpt2",
      tasks: ["TextGenerationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "text-generation",
        modelPath: "Xenova/distilgpt2",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/LaMini-Flan-T5-783M",
      title: "LaMini-Flan-T5-783M",
      description: "Xenova/LaMini-Flan-T5-783M",
      tasks: ["TextGenerationTask", "TextRewriterTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "text2text-generation",
        modelPath: "Xenova/LaMini-Flan-T5-783M",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Falconsai/text_summarization",
      title: "text_summarization",
      description: "Falconsai/text_summarization",
      tasks: ["TextSummaryTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "summarization",
        modelPath: "Falconsai/text_summarization",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/nllb-200-distilled-600M",
      title: "nllb-200-distilled-600M",
      description: "Xenova/nllb-200-distilled-600M",
      tasks: ["TextTranslationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "translation",
        modelPath: "Xenova/nllb-200-distilled-600M",
        languageStyle: "FLORES-200",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/m2m100_418M",
      title: "m2m100_418M",
      description: "Xenova/m2m100_418M",
      tasks: ["TextTranslationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "translation",
        modelPath: "Xenova/m2m100_418M",
        languageStyle: "ISO-639",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/mbart-large-50-many-to-many-mmt",
      title: "mbart-large-50-many-to-many-mmt",
      description: "Xenova/mbart-large-50-many-to-many-mmt",
      tasks: ["TextTranslationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "translation",
        modelPath: "Xenova/mbart-large-50-many-to-many-mmt",
        languageStyle: "ISO-639_ISO-3166-1-alpha-2",
      },
      metadata: {},
    },
  ];

  for (const model of onnxModels) {
    await getGlobalModelRepository().addModel(model);
  }
}
