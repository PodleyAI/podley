//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SF3 extends Form {
  static readonly name = "Registration Statement for Asset-Backed Securities (SF-3)";
  static readonly description =
    "Registration statement for asset-backed securities under the Securities Act of 1933.";
  static readonly forms = ["SF-3", "SF-3/A", "SF-3MEP"] as const;
}
