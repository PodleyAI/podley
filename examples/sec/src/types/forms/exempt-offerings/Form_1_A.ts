//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_1_A extends Form {
  static readonly name = "Reg-A Offering Statement";
  static readonly description = "Reg-A Offering Statement";
  static readonly forms = ["1-A", "1-A/A", "1", "1/A"] as const;
}
