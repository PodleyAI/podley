//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_LIQUID extends Form {
  static readonly name = "Form N-LIQUID";
  static readonly description = "Current Report Open-End Management Investment Company Liquidity.";
  static readonly forms = ["N-LIQUID", "N-LIQUID/A"] as const;
}
