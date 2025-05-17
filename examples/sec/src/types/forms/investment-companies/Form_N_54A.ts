//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_54A extends Form {
  static readonly name = "Business Development Company Registration";
  static readonly description = "Registration statement of business development companies";
  static readonly forms = ["N-54A", "N-54A/A"] as const;
}
