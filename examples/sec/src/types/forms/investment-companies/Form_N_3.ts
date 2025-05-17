//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_3 extends Form {
  static readonly name = "Separate Account Registration";
  static readonly description =
    "Registration statement of separate accounts organized as management investment companies";
  static readonly forms = ["N-3", "N-3/A"] as const;
}
