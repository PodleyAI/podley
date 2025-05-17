//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DEFC14A extends Form {
  static readonly name = "Definitive Proxy Statement with Contested Solicitations";
  static readonly description =
    "Definitive proxy statement in connection with contested solicitations.";
  static readonly forms = ["DEFC14A"] as const;
}
