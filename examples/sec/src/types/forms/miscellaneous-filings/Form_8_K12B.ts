//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_8_K12B extends Form {
  static readonly name = "Form 8-K12B";
  static readonly description =
    "Notification that a class of securities of successor issuer is deemed to be registered pursuant to section 12(b)";
  static readonly forms = ["8-K12B", "8-K12B/A"] as const;
}
