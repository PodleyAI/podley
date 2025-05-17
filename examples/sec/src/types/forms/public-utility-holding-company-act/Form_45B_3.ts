//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_45B_3 extends Form {
  static readonly name = "Extensions of Credit Statement";
  static readonly description = "Transitional initial statement concerning extensions of credit.";
  static readonly forms = ["45B-3", "45B-3/A"] as const;
}
