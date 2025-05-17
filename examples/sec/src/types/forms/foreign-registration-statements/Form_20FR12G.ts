//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_20FR12G extends Form {
  static readonly name = "Registration of Securities of Foreign Private Issuers";
  static readonly description =
    "Registration statement for securities of foreign private issuers pursuant to Section 12(g) of the Securities Exchange Act of 1934";
  static readonly forms = ["20FR12G", "20FR12G/A"] as const;
}
