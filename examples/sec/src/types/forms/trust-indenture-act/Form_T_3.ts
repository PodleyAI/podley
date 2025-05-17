//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_T_3 extends Form {
  static readonly name = "Trust Indenture Qualification";
  static readonly description =
    "Application for qualification of trust indentures. Filed pursuant to the Trust Indenture Act.";
  static readonly forms = ["T-3", "T-3/A"] as const;
}
