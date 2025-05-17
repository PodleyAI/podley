//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_VP extends Form {
  static readonly name = "Variable Contracts Notice";
  static readonly description =
    "Notice of Variable Contracts filed pursuant to Rule 12b-25 of the Investment Company Act.";
  static readonly forms = ["N-VP", "N-VP/A"] as const;
}
