//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_4 extends Form {
  static readonly name = "F-4";
  static readonly description =
    "Registration statement for securities of foreign private issuers issued in business combination transactions";
  static readonly forms = ["F-4", "F-4/A", "F-4 POS", "F-4MEF"] as const;
}
