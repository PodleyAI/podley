//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NSARB extends Form {
  static readonly name = "Annual Report for Management Companies";
  static readonly description = "Annual report for management companies.";
  static readonly forms = ["NSAR-B", "NSAR-B/A"] as const;
}
