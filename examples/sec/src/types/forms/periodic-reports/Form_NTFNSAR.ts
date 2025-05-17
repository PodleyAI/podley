//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NTFNSAR extends Form {
  static readonly name = "Notice of Inability to Timely File (N-SAR)";
  static readonly description =
    "Notice of inability to timely file its semi-annual or annual report on Form N-SAR.";
  static readonly forms = ["NTFNSAR"] as const;
}
