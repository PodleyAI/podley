//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_2_E extends Form {
  static readonly name = "Form 2-E";
  static readonly description =
    "Reports of sales of securities pursuant to Regulation E. Filed by investment companies.";
  static readonly forms = ["2-E", "2-E/A"] as const;
}
