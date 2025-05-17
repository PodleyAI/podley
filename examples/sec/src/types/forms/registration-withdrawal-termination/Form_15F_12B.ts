//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_15F_12B extends Form {
  static readonly name = "Foreign Private Issuer Section 12(b) Termination";
  static readonly description =
    "Notice of termination by a foreign private issuer of a class of securities under Section 12(b).";
  static readonly forms = ["15F-12B", "15F-12B/A"] as const;
}
