//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_6 extends Form {
  static readonly name = "Registration Statement (Variable Life Insurance UIT)";
  static readonly description =
    "Registration statement for separate accounts organized as unit investment trusts that offer variable life insurance contracts under the Investment Company Act of 1940 and the Securities Act of 1933.";
  static readonly forms = ["N-6", "N-6/A"] as const;
}
