//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_2D extends Form {
  static readonly name = "F-2D";
  static readonly description =
    "Registration statement for dividend or interest reinvestment plans of foreign private issuers";
  static readonly forms = ["F-2D", "F-2D/A"] as const;
}
