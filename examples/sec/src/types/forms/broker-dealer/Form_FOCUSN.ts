//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_FOCUSN extends Form {
  static readonly name = "Normalized FOCUS Report";
  static readonly description = "Normalized FOCUS report filed by broker-dealers.";
  static readonly forms = ["FOCUSN", "FOCUSN/A"] as const;
}
