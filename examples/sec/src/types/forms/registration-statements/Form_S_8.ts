//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_S_8 extends Form {
  static readonly name = "Registration Statement (S-8)";
  static readonly description =
    "This filing is required when securities are to be offered to employees pursuant to employee benefit plans.";
  static readonly forms = ["S-8", "S-8/A", "S-8 POS"] as const;
}
