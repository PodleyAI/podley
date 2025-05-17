//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_G_405 extends Form {
  static readonly name = "Government Securities Report";
  static readonly description =
    "Report on finances and operations of government securities brokers and dealers under Section 15C of the Exchange Act.";
  static readonly forms = ["G-405", "G-405/A", "G-405N", "G-405N/A"] as const;
}
