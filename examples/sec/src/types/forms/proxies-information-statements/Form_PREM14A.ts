//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_PREM14A extends Form {
  static readonly name = "Preliminary Proxy Statement for Merger or Acquisition";
  static readonly description =
    "A preliminary proxy statement relating to a merger or acquisition.";
  static readonly forms = ["PREM14A"] as const;
}
