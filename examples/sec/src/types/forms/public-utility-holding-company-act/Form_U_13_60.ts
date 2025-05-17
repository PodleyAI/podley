//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U_13_60 extends Form {
  static readonly name = "Annual Report for Service Companies";
  static readonly description =
    "Annual report for mutual and subsidiary service companies filed pursuant to Rule 94 of the Public Utility Holding Company Act.";
  static readonly forms = ["U-13-60", "U-13-60/A"] as const;
}
