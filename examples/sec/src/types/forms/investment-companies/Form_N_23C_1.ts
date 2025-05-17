//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_23C_1 extends Form {
  static readonly name = "Statement of Securities Purchases (Rule N-23C-1)";
  static readonly description =
    "Statement by Registered Closed-End Investment Company with respect to purchases of its own securities pursuant to Rule N-23C-1 during the last calendar month.";
  static readonly forms = ["N-23C-1", "N-23C-1/A"] as const;
}
