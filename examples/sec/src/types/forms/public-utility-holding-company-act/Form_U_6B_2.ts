//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U_6B_2 extends Form {
  static readonly name = "Security Issue Certificate";
  static readonly description =
    "Certificate of notification of security issue, renewal or guaranty filed pursuant to Rule 20(d) of the Public Utility Holding Company Act.";
  static readonly forms = ["U-6B-2"] as const;
}
