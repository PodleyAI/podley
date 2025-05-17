//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_PREM14C extends Form {
  static readonly name = "Preliminary Information Statement for Merger or Acquisition";
  static readonly description =
    "A preliminary information statement relating to a merger or acquisition.";
  static readonly forms = ["PREM14C"] as const;
}
