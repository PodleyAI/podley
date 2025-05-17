//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DEFM14C extends Form {
  static readonly name = "Definitive Information Statement for Merger or Acquisition";
  static readonly description =
    "A definitive information statement relating to a merger or an acquisition.";
  static readonly forms = ["DEFM14C"] as const;
}
