//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NT_15D2 extends Form {
  static readonly name = "Form NT 15D2";
  static readonly description =
    "Notification of late filing Special report pursuant to section 15d-2.";
  static readonly forms = ["NT 15D2", "NT 15D2/A"] as const;
}
