//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_8_K12G3 extends Form {
  static readonly name = "Form 8-K12G3";
  static readonly description =
    "Notification of securities of successor issuers deemed to be registered pursuant to section 12(g) of the Securities Exchange Act.";
  static readonly forms = ["8-K12G3", "8-K12G3/A"] as const;
}
