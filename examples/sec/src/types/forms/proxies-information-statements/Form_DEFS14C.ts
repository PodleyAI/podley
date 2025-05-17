//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DEFS14C extends Form {
  static readonly name = "Definitive Information Statement for Special Meeting";
  static readonly description = "A definitive information statement regarding a special meeting.";
  static readonly forms = ["DEFS14C"] as const;
}
