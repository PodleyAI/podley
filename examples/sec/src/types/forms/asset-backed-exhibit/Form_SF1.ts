//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SF1 extends Form {
  static readonly name = "Registration Statement for Asset-Backed Securities (SF-1)";
  static readonly description =
    "Registration statement for asset-backed securities under the Securities Act of 1933.";
  static readonly forms = ["SF-1", "SF-1/A", "SF-1MEP"] as const;
}
