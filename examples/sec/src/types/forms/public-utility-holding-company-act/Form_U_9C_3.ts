//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_U_9C_3 extends Form {
  static readonly name = "Energy and Gas Companies Quarterly Report";
  static readonly description = "Quarterly report concerning energy and gas-related companies.";
  static readonly forms = ["U-9C-3", "U-9C-3/A"] as const;
}
