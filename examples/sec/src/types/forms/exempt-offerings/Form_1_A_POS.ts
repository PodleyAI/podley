//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_1_A_POS extends Form {
  static readonly name = "Post-Qualification Amendment to Offering Statement (Reg-A)";
  static readonly description = "Post-qualification amendment to offering statement";
  static readonly forms = ["1-A POS"] as const;
}
