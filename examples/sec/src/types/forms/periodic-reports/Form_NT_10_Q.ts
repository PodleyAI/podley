//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NT_10_Q extends Form {
  static readonly name = "Late Filing Notification";
  static readonly description = "Notification that form type 10-Q will be submitted late.";
  static readonly forms = ["NT 10-Q", "NT 10-Q/A"] as const;
}
