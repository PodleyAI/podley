//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_4 extends Form {
  static readonly name = "Variable Annuity Registration";
  static readonly description = "Registration statement of variable annuity contracts";
  static readonly forms = ["N-4", "N-4/A"] as const;
}
