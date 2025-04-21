//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskInput, TaskInputDefinition } from "@ellmers/task-graph";
import { SecCachedFetchTask, SecCachedFetchTaskInput } from "../fetch/SecCachedFetchTask";

// NOTE: accession documents are immutable, so we don't need to pass in a date for invalidation

export interface SecFetchAccessionDocTaskInput extends SecCachedFetchTaskInput {
  accessionNumber: string;
  fileName: string;
}

export interface SecFetchAccessionDocTaskOutput extends TaskInput {
  accessionDoc: string;
}

export class SecFetchAccessionDocTask extends SecCachedFetchTask<SecFetchAccessionDocTaskInput> {
  static readonly type = "SecFetchAccessionDocTask";
  static readonly category = "Hidden";
  static readonly immutable = true;

  public static inputs: TaskInputDefinition[] = [
    {
      id: "cik",
      name: "CIK",
      valueType: "number",
    },
    {
      id: "accessionNumber",
      name: "Accession Number",
      valueType: "string",
    },
    {
      id: "fileName",
      name: "File Name",
      valueType: "string",
    },
  ] as const;

  inputToFileName(input: SecFetchAccessionDocTaskInput): string {
    return `accessiondocs/${input.cik.toString().padStart(10, "0")}/${input.accessionNumber.replaceAll("-", "")}-${input.fileName}`;
  }
  inputToUrl(input: SecFetchAccessionDocTaskInput): string {
    return `https://www.sec.gov/Archives/edgar/data/${input.cik.toString().padStart(10, "0")}/${input.accessionNumber.replaceAll("-", "")}/${input.fileName}`;
  }
}
