//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DEF_14C extends Form {
  static readonly name = "Definitive Information Statement";
  static readonly description =
    "Definitive information statement containing all other information.";
  static readonly forms = ["DEF 14C"] as const;
}
