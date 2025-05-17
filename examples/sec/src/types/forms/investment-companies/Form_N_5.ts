//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_5 extends Form {
  static readonly name = "Small Business Investment Company Registration";
  static readonly description = "Registration statement of small business investment companies";
  static readonly forms = ["N-5", "N-5/A"] as const;
}
