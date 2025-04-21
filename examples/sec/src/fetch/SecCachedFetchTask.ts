//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, TaskConfig, TaskInput, TaskOutput } from "@ellmers/task-graph";
import { FetchTaskInput, FetchTaskOutput } from "@ellmers/tasks";
import { globalServiceRegistry } from "@ellmers/util";
import path from "node:path";
import { SEC_RAW_DATA_FOLDER } from "../util/tokens";
import { SecFetchFileOutputCache } from "./SecFetchFileOutputCache";
import { SecFetchTask } from "./SecFetchTask";

export interface SecCachedFetchTaskInput extends TaskInput {
  cik: number;
  date?: string;
}

export abstract class SecCachedFetchTask<
  I extends SecCachedFetchTaskInput = SecCachedFetchTaskInput,
  O extends TaskOutput = FetchTaskOutput,
> extends SecFetchTask<I & FetchTaskInput, O> {
  static type = "SecCachedFetchTask";
  static category = "Hidden";
  static cacheable = true;
  static immutable = false;

  abstract inputToFileName(input: any): string;
  abstract inputToUrl(input: any): string;

  constructor(input: I, config: Partial<TaskConfig> = {}) {
    super(input as I & FetchTaskInput, config);
    const globalPath = globalServiceRegistry.get(SEC_RAW_DATA_FOLDER);
    if (globalPath) {
      let folderPath;
      if (globalPath.startsWith("/")) {
        folderPath = path.join(globalPath);
      } else {
        folderPath = path.join(process.cwd(), globalPath);
      }
      this.config.outputCache = new SecFetchFileOutputCache({
        folderPath: folderPath,
        inputToFileName: this.inputToFileName,
      });
    }
  }

  execute(input: I, executeConfig: IExecuteConfig): Promise<O | undefined> {
    const uri = new URL(this.inputToUrl(input));
    const ext = uri.pathname.split(".").pop() ?? "json";
    let response_type: "text" | "json" | "blob" | "arraybuffer" = "json";
    switch (ext) {
      case "txt":
      case "xml":
      case "csv":
      case "html":
      case "htm":
        response_type = "text";
        break;
      case "json":
        response_type = "json";
        break;
      case "pdf":
      case "doc":
      case "docx":
      case "xls":
      case "xlsx":
      case "ppt":
      case "pptx":
      case "gif":
      case "jpg":
      case "jpeg":
      case "png":
      case "ico":
      case "webp":
        response_type = "blob";
        break;
      default:
        response_type = "blob";
        break;
    }

    const fetchInput = {
      url: this.inputToUrl(input),
      response_type: response_type,
    };

    return super.execute(fetchInput as I & FetchTaskInput, executeConfig);
  }
}
