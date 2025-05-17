//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_6EF extends Form {
  static readonly name = "F-6EF";
  static readonly description =
    "Registration statement for American Depositary Receipts (ADRs) filed electronically";
  static readonly forms = ["F-6EF", "F-6EF/A"] as const;
}
