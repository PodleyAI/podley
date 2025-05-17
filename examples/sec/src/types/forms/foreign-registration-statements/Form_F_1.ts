//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_1 extends Form {
  static readonly name = "F-1";
  static readonly description = "Registration statement for foreign private issuers";
  static readonly forms = ["F-1", "F-1/A"] as const;
}
