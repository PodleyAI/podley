//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DEFN14A extends Form {
  static readonly name = "Non-Management Definitive Proxy Statement";
  static readonly description =
    "Definitive proxy statement filed by non-management not in connection with contested solicitations.";
  static readonly forms = ["DEFN14A"] as const;
}
