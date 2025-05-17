//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NSARU extends Form {
  static readonly name = "Annual Report for Unit Investment Trusts";
  static readonly description = "Annual report for unit investment trusts.";
  static readonly forms = ["NSAR-U", "NSAR-U/A"] as const;
}
