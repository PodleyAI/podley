//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SC_14F1 extends Form {
  static readonly name = "Information Statement";
  static readonly description =
    "This filing is made by an issuer that is changing its board of directors or management.";
  static readonly forms = ["SC 14F1", "SC 14F1/A"] as const;
}
