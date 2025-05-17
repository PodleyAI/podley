//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SEC_STAFF_LETTER extends Form {
  static readonly name = "SEC Staff Letter";
  static readonly description = "SEC staff letter.";
  static readonly forms = ["SEC STAFF LETTER"] as const;
}
