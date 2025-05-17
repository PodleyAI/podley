//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U_1 extends Form {
  static readonly name = "Application of Declaration";
  static readonly description =
    "Application of declaration under the Public Utility Holding Company Act.";
  static readonly forms = ["U-1", "U-1/A"] as const;
}
