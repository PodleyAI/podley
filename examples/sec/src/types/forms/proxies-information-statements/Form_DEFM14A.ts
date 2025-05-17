//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DEFM14A extends Form {
  static readonly name = "Definitive Proxy Statement for Merger or Acquisition";
  static readonly description =
    "Provides official notification to designated classes of shareholders of matters relating to a merger or acquisition.";
  static readonly forms = ["DEFM14A"] as const;
}
