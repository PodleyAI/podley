//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_PRE_14A extends Form {
  static readonly name = "Preliminary Proxy Statement";
  static readonly description =
    "A preliminary proxy statement providing official notification to designated classes of shareholders of matters to be brought to a vote at a shareholders meeting.";
  static readonly forms = [
    "PRE 14A",
    "PRE 14A/A",
    "PRE14A",
    "PREN14A",
    "PREN14A/A",
    "PREM14A",
    "PREM14A/A",
    "PREC14A",
    "PREC14A/A",
  ] as const;
}
