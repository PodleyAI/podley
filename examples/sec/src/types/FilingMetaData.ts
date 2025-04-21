//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ObjectToArray } from "@ellmers/util";
import { RegistrationForm } from "./FormNames";

export type FilingMetaData = {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  acceptanceDateTime: string;
  act: string; // 33, 34 or ""
  form: RegistrationForm; // form name/number
  fileNumber: string;
  filmNumber: string;
  items: string;
  size: number;
  isXBRL: "0" | "1";
  isInlineXBRL: "0" | "1";
  primaryDocument: string;
  primaryDocDescription: string;
};

export type Filings = ObjectToArray<FilingMetaData>;
