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
export interface SecCachedFetchTaskInput {
  cik: number;
  date?: string;
  response_type?: response_type;
}

function guessResponseType(urlstr: string, input: FetchTaskInput): response_type {
  const url = new URL(urlstr);
  const ext = url.pathname.split(".").pop() ?? "json";
  let response_type = input.response_type;

  if (!response_type) {
    switch (ext) {
      case "idx":
      case "txt":
      case "xml":
      case "xbrl":
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
  }
  return response_type;
}

export abstract class SecCachedFetchTask<
  I = SecCachedFetchTaskInput,
  O extends TaskOutput = FetchTaskOutput,
> extends SecFetchTask<I & FetchTaskInput, O> {
  static type = "SecCachedFetchTask";
  static category = "Hidden";
  static cacheable = true;
  static immutable = false;

  abstract inputToFileName(input: I): string;
  abstract inputToUrl(input: I): string;

  constructor(input: I, config: Partial<TaskConfig> = {}) {
    super(input as I & FetchTaskInput, config);
    if (!(input as FetchTaskInput).response_type) {
      const response_type = guessResponseType(this.inputToUrl(input), input as FetchTaskInput);
      (input as FetchTaskInput).response_type = response_type;
      (this.defaults as FetchTaskInput).response_type = response_type;
      (this.runInputData as FetchTaskInput).response_type = response_type;
    }

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

  execute(input: I & FetchTaskInput, executeConfig: IExecuteConfig): Promise<O | undefined> {
    const url = this.inputToUrl(input);
    const response_type = guessResponseType(url, input);

    const fetchInput = {
      url: url,
      method: "GET",
      response_type: response_type,
    };

    return super.execute(fetchInput as I & FetchTaskInput, executeConfig);
  }
}
