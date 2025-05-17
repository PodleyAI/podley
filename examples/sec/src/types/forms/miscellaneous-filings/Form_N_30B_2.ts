//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_30B_2 extends Form {
  static readonly name = "Form N-30B-2";
  static readonly description =
    "Periodic and interim reports mailed to shareholders. Filed by registered investment companies.";
  static readonly forms = ["N-30B-2", "N-30B-2/A"] as const;
}
