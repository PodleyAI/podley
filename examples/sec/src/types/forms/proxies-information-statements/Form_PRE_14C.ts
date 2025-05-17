//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_PRE_14C extends Form {
  static readonly name = "Preliminary Information Statement";
  static readonly description = "A preliminary proxy statement containing all other information.";
  static readonly forms = ["PRE 14C"] as const;
}
