//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DEFS14A extends Form {
  static readonly name = "Definitive Proxy Statement for Special Meeting";
  static readonly description =
    "A definitive proxy statement giving notice regarding a special meeting.";
  static readonly forms = ["DEFS14A"] as const;
}
