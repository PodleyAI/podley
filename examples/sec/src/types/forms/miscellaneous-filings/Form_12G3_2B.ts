//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_12G3_2B extends Form {
  static readonly name = "Form 12G3-2B";
  static readonly description =
    "Annual and transition reports of foreign private issuers pursuant to section 13 or 15(d) of the Securities Exchange Act.";
  static readonly forms = ["12G3-2B"] as const;
}
