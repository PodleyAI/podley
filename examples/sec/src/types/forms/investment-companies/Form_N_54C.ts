//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_54C extends Form {
  static readonly name = "Business Development Company Registration Amendment";
  static readonly description =
    "Amendment to registration statement of business development companies";
  static readonly forms = ["N-54C", "N-54C/A"] as const;
}
