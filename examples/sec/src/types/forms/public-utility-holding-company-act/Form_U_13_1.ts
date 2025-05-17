//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U_13_1 extends Form {
  static readonly name = "Mutual Service Company Application";
  static readonly description =
    "Application for approval for mutual service company filed pursuant to Rule 88 of the Public Utility Holding Company Act.";
  static readonly forms = ["U-13-1", "U-13-1/A"] as const;
}
