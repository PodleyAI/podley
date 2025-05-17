//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U_12_IB extends Form {
  static readonly name = "Annual Statement";
  static readonly description =
    "Annual statement pursuant to section 12(i) of the Public Utility Holding Company Act.";
  static readonly forms = ["U-12-IB", "U-12-IB/A"] as const;
}
