//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_10 extends Form {
  static readonly name = "F-10";
  static readonly description =
    "Registration statement for foreign private issuers with substantial U.S. market interest and reporting history under the Securities Exchange Act";
  static readonly forms = ["F-10", "F-10/A"] as const;
}
