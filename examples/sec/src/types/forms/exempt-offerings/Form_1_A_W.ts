//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_1_A_W extends Form {
  static readonly name = "Reg-A Offering Statement Withdrawal";
  static readonly description = "Offering Statement Withdrawal";
  static readonly forms = ["1-A-W", "1-A-W/A"] as const;
}
