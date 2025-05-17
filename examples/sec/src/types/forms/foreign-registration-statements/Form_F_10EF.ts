//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_10EF extends Form {
  static readonly name = "F-10EF";
  static readonly description =
    "Registration statement for foreign private issuers filed electronically";
  static readonly forms = ["F-10EF", "F-10EF/A"] as const;
}
