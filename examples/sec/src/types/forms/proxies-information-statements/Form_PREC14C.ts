//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_PREC14C extends Form {
  static readonly name = "Preliminary Information Statement with Contested Solicitations";
  static readonly description =
    "Preliminary information statement containing contested solicitations.";
  static readonly forms = ["PREC14C"] as const;
}
