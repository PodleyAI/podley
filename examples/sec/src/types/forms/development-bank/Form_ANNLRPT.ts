//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_ANNLRPT extends Form {
  static readonly name = "Annual Development Bank Report";
  static readonly description = "Periodic Development Bank filing, submitted annually.";
  static readonly forms = ["ANNLRPT", "ANNLRPT/A"] as const;
}
