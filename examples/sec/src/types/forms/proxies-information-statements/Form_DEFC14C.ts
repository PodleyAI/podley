//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DEFC14C extends Form {
  static readonly name = "Definitive Information Statement with Contested Solicitations";
  static readonly description =
    "Definitive information statement indicating contested solicitations.";
  static readonly forms = ["DEFC14C"] as const;
}
