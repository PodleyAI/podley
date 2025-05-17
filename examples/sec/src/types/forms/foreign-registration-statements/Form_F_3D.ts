//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_3D extends Form {
  static readonly name = "F-3D";
  static readonly description =
    "Registration statement for dividend or interest reinvestment plans of foreign private issuers with substantial U.S. market interest";
  static readonly forms = ["F-3D", "F-3D/A"] as const;
}
