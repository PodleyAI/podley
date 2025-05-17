//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_6 extends Form {
  static readonly name = "American Depositary Receipts Registration";
  static readonly description =
    "Registration statement for American Depositary Receipts (ADRs) for foreign issuers";
  static readonly forms = ["F-6", "F-6/A"] as const;
}
