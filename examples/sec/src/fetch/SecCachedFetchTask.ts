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

export type response_type = "text" | "json" | "blob" | "arraybuffer";
export interface SecCachedFetchTaskInput extends TaskInput {
  cik: number;
  date?: string;
}

export abstract class SecCachedFetchTask<
  I extends TaskInput = SecCachedFetchTaskInput,
  O extends TaskOutput = FetchTaskOutput,
> extends SecFetchTask<I & FetchTaskInput, O> {
  static type = "SecCachedFetchTask";
  static category = "Hidden";
  static cacheable = true;
  static immutable = false;

  response_type?: response_type;

  abstract inputToFileName(input: I): string;
  abstract inputToUrl(input: I): string;

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
        inputToFileName: this.inputToFileName.bind(this),
      });
    }
  }

  execute(input: I, executeConfig: IExecuteConfig): Promise<O | undefined> {
    const uri = new URL(this.inputToUrl(input));
    const ext = uri.pathname.split(".").pop() ?? "json";

    if (!this.response_type) {
      switch (ext) {
        case "idx":
        case "txt":
        case "xml":
        case "xbrl":
        case "csv":
        case "html":
        case "htm":
          this.response_type = "text";
          break;
        case "json":
          this.response_type = "json";
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
          this.response_type = "blob";
          break;
        default:
          this.response_type = "blob";
          break;
      }
    }

    const fetchInput = {
      url: this.inputToUrl(input),
      response_type: this.response_type,
    };

    return super.execute(fetchInput as I & FetchTaskInput, executeConfig);
  }
}
