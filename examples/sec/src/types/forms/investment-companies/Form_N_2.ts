//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_2 extends Form {
  static readonly name = "Closed End Management Investment Company Registration";
  static readonly description =
    "Registration statement of closed-end management investment companies";
  static readonly forms = ["N-2", "N-2/A", "N-2MEF"] as const;
}
