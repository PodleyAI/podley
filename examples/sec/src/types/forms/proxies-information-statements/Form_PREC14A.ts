//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_PREC14A extends Form {
  static readonly name = "Preliminary Proxy Statement with Contested Solicitations";
  static readonly description = "Preliminary proxy statement containing contested solicitations.";
  static readonly forms = ["PREC14A"] as const;
}
