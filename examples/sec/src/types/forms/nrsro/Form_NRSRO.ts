//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NRSRO extends Form {
  static readonly name = "Application for NRSRO";
  static readonly description =
    "Initial application for registration as a Nationally Recognized Statistical Rating Organization.";
  static readonly forms = ["NRSRO", "NRSRO/A"] as const;
}
