//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_3 extends Form {
  static readonly name = "F-3";
  static readonly description =
    "Registration statement for foreign private issuers with substantial U.S. market interest and reporting history";
  static readonly forms = ["F-3", "F-3/A", "F-3MEF", "F-3 POS"] as const;
}
