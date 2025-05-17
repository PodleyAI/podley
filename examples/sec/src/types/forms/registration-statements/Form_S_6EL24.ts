//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_S_6EL24 extends Form {
  static readonly name = "Registration Statement (S-6EL24)";
  static readonly description =
    "Registration statements of unit investment trusts with 24f-2 election.";
  static readonly forms = ["S-6EL24"] as const;
}
