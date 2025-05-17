//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_13FCONP extends Form {
  static readonly name = "Compiled Holdings Report";
  static readonly description =
    "Quarterly report filed by institutional investment managers (compiled holdings report).";
  static readonly forms = ["13FCONP", "13FCONP/A"] as const;
}
