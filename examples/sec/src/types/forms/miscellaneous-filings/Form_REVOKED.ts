//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_REVOKED extends Form {
  static readonly name = "Form REVOKED";
  static readonly description = "Revoked filing.";
  static readonly forms = ["REVOKED"] as const;
}
