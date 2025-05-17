//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_S_20 extends Form {
  static readonly name = "Registration Statement (S-20)";
  static readonly description = "Initial registration statement for standardized options.";
  static readonly forms = ["S-20", "S-20/A"] as const;
}
