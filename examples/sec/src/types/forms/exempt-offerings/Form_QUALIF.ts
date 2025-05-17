//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_QUALIF extends Form {
  static readonly name = "Qualification of Offering Statement";
  static readonly description = "Qualification of an offering statement and ready to sell.";
  static readonly forms = ["QUALIF"] as const;
}
