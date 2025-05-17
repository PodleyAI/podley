//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U_3A3_1 extends Form {
  static readonly name = "Bank Exemption Statement";
  static readonly description =
    "Twelve-month statement by bank claiming exemption from provisions of the act pursuant to Rule 3 of the Public Utility Holding Company Act.";
  static readonly forms = ["U-3A3-1", "U-3A3-1/A"] as const;
}
