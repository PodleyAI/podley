//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_S_11 extends Form {
  static readonly name = "Registration Statement (S-11)";
  static readonly description =
    "Filing for the registration of securities of certain real estate companies.";
  static readonly forms = ["S-11", "S-11/A", "S-11MEF"] as const;
}
