//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_40FR12G extends Form {
  static readonly name = "Securities Registration (Canadian Issuers, Sec 12(g))";
  static readonly description =
    "Registration of securities of Canadian issuers under Section 12(g).";
  static readonly forms = ["40FR12G", "40FR12G/A"] as const;
}
