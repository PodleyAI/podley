//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_2 extends Form {
  static readonly name = "F-2";
  static readonly description =
    "Registration statement for foreign private issuers with substantial U.S. market interest";
  static readonly forms = ["F-2", "F-2/A"] as const;
}
