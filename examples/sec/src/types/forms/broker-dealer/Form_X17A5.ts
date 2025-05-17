//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_X17A5 extends Form {
  static readonly name = "Annual FOCUS Report (X-17A-5)";
  static readonly description = "Annual FOCUS report filed by broker-dealers under Rule 17a-5.";
  static readonly forms = ["X-17A-5", "X-17A-5/A"] as const;
}
