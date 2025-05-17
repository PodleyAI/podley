//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_6_K extends Form {
  static readonly name = "Form 6-K";
  static readonly description =
    "Report of foreign issuer pursuant to Rules 13a-16 and 15d-16 of the Securities Exchange Act.";
  static readonly forms = ["6-K", "6-K/A"] as const;
}
