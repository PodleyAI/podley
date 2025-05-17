//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_305B2 extends Form {
  static readonly name = "Trust Indenture Statement";
  static readonly description = "Initial statement filed pursuant to the Trust Indenture Act.";
  static readonly forms = ["305B2", "305B2/A"] as const;
}
