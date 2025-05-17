//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_VPFS extends Form {
  static readonly name = "Financial Statements for Variable Contracts";
  static readonly description =
    "Financial statements for certain variable contracts filed pursuant to the Investment Company Act.";
  static readonly forms = ["N-VPFS", "N-VPFS/A"] as const;
}
