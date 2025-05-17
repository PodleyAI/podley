//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_1 extends Form {
  static readonly name = "Registration Statement for Open-End Management Investment Companies";
  static readonly description =
    "Registration statement for open-end management investment companies pursuant to the Securities Act of 1933";
  static readonly forms = ["N-1", "N-1/A"] as const;
}
