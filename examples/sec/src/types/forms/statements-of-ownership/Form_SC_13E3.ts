//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SC_13E3 extends Form {
  static readonly name = "Going Private Transaction";
  static readonly description = "This filing is made by an issuer that is going private.";
  static readonly forms = ["SC 13E3", "SC 13E3/A"] as const;
}
