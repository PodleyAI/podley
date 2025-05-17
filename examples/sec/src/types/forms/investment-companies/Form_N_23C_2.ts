//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_23C_2 extends Form {
  static readonly name = "Notice by Closed-End IC (Rule 23c-2)";
  static readonly description =
    "Notice by registered closed-end investment companies…pursuant to Rule 23c-2.";
  static readonly forms = ["N-23C-2", "N-23C-2/A"] as const;
}
