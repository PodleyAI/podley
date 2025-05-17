//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_S_6 extends Form {
  static readonly name = "Registration Statement (S-6)";
  static readonly description = "Initial registration statement for unit investment trusts.";
  static readonly forms = ["S-6", "S-6/A", "S-6 POS"] as const;
}
