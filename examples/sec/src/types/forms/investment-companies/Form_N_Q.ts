//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_Q extends Form {
  static readonly name = "Quarterly Schedule of Portfolio Holdings";
  static readonly description =
    "Quarterly Schedule of Portfolio Holdings of Registered Management Investment Company filed on Form N-Q.";
  static readonly forms = ["N-Q", "N-Q/A"] as const;
}
