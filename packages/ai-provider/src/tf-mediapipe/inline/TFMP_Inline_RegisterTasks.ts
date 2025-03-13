import {
  getAiProviderRegistry,
  TextEmbeddingTaskInput,
  TextEmbeddingTaskOutput,
} from "@ellmers/ai";
import { DownloadModelTask, TextEmbeddingTask } from "@ellmers/ai";
import { TFMP_Inline_Download, TFMP_Inline_TextEmbedding } from "./TFMP_Inline_TaskRun";
import { MEDIA_PIPE_TFJS_MODEL } from "../common/TFMP_Constants";

export const registerMediaPipeTfJsLocalTasks = () => {
  const aiProviderRegistry = getAiProviderRegistry();

  aiProviderRegistry.registerRunFn(
    DownloadModelTask.type,
    MEDIA_PIPE_TFJS_MODEL,
    TFMP_Inline_Download
  );

  aiProviderRegistry.registerRunFn<TextEmbeddingTaskInput, TextEmbeddingTaskOutput>(
    TextEmbeddingTask.type,
    MEDIA_PIPE_TFJS_MODEL,
    TFMP_Inline_TextEmbedding
  );
};
