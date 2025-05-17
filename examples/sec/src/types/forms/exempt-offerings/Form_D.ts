//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_D extends Form {
  static readonly name = "Notice of Sales of Unregistered Securities (Form D)";
  static readonly description = "Notice of sales of unregistered securities";
  static readonly forms = ["D", "D/A"] as const;
}
