//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U_57 extends Form {
  static readonly name = "Foreign Utility Company Status Notification";
  static readonly description =
    "Notification of Foreign Utility Company Status under section 33(a)(2) of the Public Utility Holding Company Act.";
  static readonly forms = ["U-57", "U-57/A"] as const;
}
