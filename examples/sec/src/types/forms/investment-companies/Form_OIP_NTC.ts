//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_OIP_NTC extends Form {
  static readonly name = "Notice (Sec 8(a) ICA 1940)";
  static readonly description = "Notice under Section 8(a) of the Investment Company Act of 1940.";
  static readonly forms = ["OIP NTC"] as const;
}
