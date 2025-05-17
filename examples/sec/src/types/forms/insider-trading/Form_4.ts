//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_4 extends Form {
  static readonly name = "Statement of Changes in Beneficial Ownership";
  static readonly description =
    "Any changes to a previously filed form 3 are reported in this filing.";
  static readonly forms = ["4", "4/A"] as const;
}
