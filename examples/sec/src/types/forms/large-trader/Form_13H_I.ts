//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_13H_I extends Form {
  static readonly name = "Large Trader Inactive Status";
  static readonly description = "Large trader inactive status filing pursuant to Rule 13h-1.";
  static readonly forms = ["13H-I"] as const;
}
