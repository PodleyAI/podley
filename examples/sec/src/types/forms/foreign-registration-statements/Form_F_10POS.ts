//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_10POS extends Form {
  static readonly name = "F-10POS";
  static readonly description = "Post-effective amendment to F-10 registration statement";
  static readonly forms = ["F-10POS"] as const;
}
