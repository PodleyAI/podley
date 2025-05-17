//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_MA extends Form {
  static readonly name = "Municipal Advisor Registration";
  static readonly description =
    "Application for municipal advisor registration under Section 15B(a)(1) of the Exchange Act.";
  static readonly forms = ["MA", "MA/A", "MA-W", "CANCELLATION-MA"] as const; // MA-W (Withdrawal of a Municipal Advisor Registration)
}
