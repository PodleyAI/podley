//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NO_ACT extends Form {
  static readonly name = "No-Action Letter Request";
  static readonly description = "No-action letter request.";
  static readonly forms = ["NO ACT"] as const;
}
