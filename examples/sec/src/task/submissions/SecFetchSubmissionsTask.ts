//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Static, TObject, Type } from "@sinclair/typebox";
import { SecCachedFetchTask } from "../../fetch/SecCachedFetchTask";
import { FullCompanySubmissionSchema, TypeSecCik } from "../../types/CompanySubmission";
import { TypeOptionalSecDate } from "../../util/parseDate";

// NOTE: company submissions are mutable, so we need to pass in a date to break the cache

const SecFetchSubmissionsTaskInputSchema = () =>
  Type.Object({
    cik: TypeSecCik(),
    file: Type.Optional(Type.String()),
    date: TypeOptionalSecDate(),
  });

export type SecFetchSubmissionsTaskInput = Static<
  ReturnType<typeof SecFetchSubmissionsTaskInputSchema>
>;

const SecFetchSubmissionsTaskOutputSchema = () =>
  Type.Object({
    json: FullCompanySubmissionSchema(),
  });

export type SecFetchSubmissionsTaskOutput = Static<
  ReturnType<typeof SecFetchSubmissionsTaskOutputSchema>
>;

export class SecFetchSubmissionsTask extends SecCachedFetchTask<
  SecFetchSubmissionsTaskInput,
  SecFetchSubmissionsTaskOutput
> {
  static readonly type = "SecFetchSubmissionsTask";
  static readonly category = "Hidden";
  static readonly immutable = false;

  public static inputSchema(): TObject {
    return SecFetchSubmissionsTaskInputSchema();
  }

  public static outputSchema(): TObject {
    return SecFetchSubmissionsTaskOutputSchema();
  }

  inputToFileName(input: SecFetchSubmissionsTaskInput): string {
    const cik = input.cik.toString().padStart(10, "0");
    const fileName = input.file || `CIK${cik}.json`;
    return `submissions/${fileName}`;
  }
  inputToUrl(input: SecFetchSubmissionsTaskInput): string {
    const cik = input.cik.toString().padStart(10, "0");
    const fileName = input.file || `CIK${cik}.json`;
    return `https://data.sec.gov/submissions/${fileName}${input.date ? `?date=${input.date}` : ""}`;
  }
}
