//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NSARA extends Form {
  static readonly name = "Semi-Annual Report for Management Companies";
  static readonly description = "Semi-annual report for management companies.";
  static readonly forms = ["NSAR-A", "NSAR-A/A"] as const;
}
