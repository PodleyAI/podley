import { getGlobalModelRepository } from "@workglow/ai";
import { HF_TRANSFORMERS_ONNX, HfTransformersOnnxModelRecord } from "@workglow/ai-provider";

export async function registerHuggingfaceLocalModels(): Promise<void> {
  const onnxModels: HfTransformersOnnxModelRecord[] = [
    {
      model_id: "onnx:Supabase/gte-small:q8",
      title: "gte-small",
      description: "Supabase/gte-small quantized to 8bit",
      tasks: ["TextEmbeddingTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "feature-extraction",
        modelPath: "Supabase/gte-small",
        dType: "q8",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/bge-base-en-v1.5:q8",
      title: "bge-base-en-v1.5",
      description: "Xenova/bge-base-en-v1.5 quantized to 8bit",
      tasks: ["TextEmbeddingTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "feature-extraction",
        modelPath: "Xenova/bge-base-en-v1.5",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/distilbert-base-uncased-distilled-squad:q8",
      title: "distilbert-base-uncased-distilled-squad",
      description: "Xenova/distilbert-base-uncased-distilled-squad quantized to 8bit",
      tasks: ["TextQuestionAnsweringTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "question-answering",
        modelPath: "Xenova/distilbert-base-uncased-distilled-squad",
      },
      metadata: {},
    },
    {
      model_id: "onnx:answerdotai/ModernBERT-base:q8",
      title: "ModernBERT-base",
      description: "answerdotai/ModernBERT-base quantized to 8bit",
      tasks: ["TextClassificationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "feature-extraction",
        modelPath: "Xenova/multi-qa-mpnet-base-dot-v1",
        dType: "q8",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/gpt2:q8",
      title: "gpt2",
      description: "Xenova/gpt2 quantized to 8bit",
      tasks: ["TextGenerationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "text-generation",
        modelPath: "Xenova/gpt2",
        dType: "q8",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/Phi-3-mini-4k-instruct:q4f16",
      title: "Phi-3-mini-4k-instruct:q4f16",
      description: "Xenova/Phi-3-mini-4k-instruct quantized to q4f16",
      tasks: ["TextGenerationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "text-generation",
        modelPath: "Xenova/Phi-3-mini-4k-instruct",
        dType: "q4f16",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/distilgpt2:q8",
      title: "distilgpt2",
      description: "Xenova/distilgpt2 quantized to 8bit",
      tasks: ["TextGenerationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "text-generation",
        modelPath: "Xenova/distilgpt2",
        dType: "q8",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
      title: "LaMini-Flan-T5-783M",
      description: "Xenova/LaMini-Flan-T5-783M quantized to 8bit",
      tasks: ["TextGenerationTask", "TextRewriterTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "text2text-generation",
        modelPath: "Xenova/LaMini-Flan-T5-783M",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
      title: "LaMini-Flan-T5-783M",
      description: "Xenova/LaMini-Flan-T5-783M quantized to 8bit",
      tasks: ["TextGenerationTask", "TextRewriterTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "text2text-generation",
        modelPath: "Xenova/LaMini-Flan-T5-783M",
        dType: "q8",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Falconsai/text_summarization:q8",
      title: "text_summarization",
      description: "Falconsai/text_summarization quantized to 8bit",
      tasks: ["TextSummaryTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "summarization",
        modelPath: "Falconsai/text_summarization",
        dType: "q8",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/nllb-200-distilled-600M:q8",
      title: "nllb-200-distilled-600M",
      description: "Xenova/nllb-200-distilled-600M quantized to 8bit",
      tasks: ["TextTranslationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "translation",
        modelPath: "Xenova/nllb-200-distilled-600M",
        languageStyle: "FLORES-200",
        dType: "q8",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/m2m100_418M:q8",
      title: "m2m100_418M",
      description: "Xenova/m2m100_418M quantized to 8bit",
      tasks: ["TextTranslationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "translation",
        modelPath: "Xenova/m2m100_418M",
        languageStyle: "ISO-639",
        dType: "q8",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/m2m100_418M:q8",
      title: "m2m100_418M",
      description: "Xenova/m2m100_418M quantized to 8bit",
      tasks: ["TextTranslationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "translation",
        modelPath: "Xenova/m2m100_418M",
        languageStyle: "ISO-639",
        dType: "q8",
      },
      metadata: {},
    },
    {
      model_id: "onnx:Xenova/mbart-large-50-many-to-many-mmt:q8",
      title: "mbart-large-50-many-to-many-mmt",
      description: "Xenova/mbart-large-50-many-to-many-mmt quantized to 8bit",
      tasks: ["TextTranslationTask"],
      provider: HF_TRANSFORMERS_ONNX,
      providerConfig: {
        pipeline: "translation",
        modelPath: "Xenova/mbart-large-50-many-to-many-mmt",
        languageStyle: "ISO-639_ISO-3166-1-alpha-2",
        dType: "q8",
      },
      metadata: {},
    },
  ];

  for (const model of onnxModels) {
    await getGlobalModelRepository().addModel(model);
  }
}
