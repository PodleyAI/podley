//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_8_K15D5 extends Form {
  static readonly name = "Form 8-K15D5";
  static readonly description = "Notification of assumption of duty to report by successor issuer.";
  static readonly forms = ["8-K15D5", "8-K15D5/A"] as const;
}
