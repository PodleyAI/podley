//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DFRN14C extends Form {
  static readonly name = "Definitive Information Statement - Non-Management";
  static readonly description =
    "Definitive information statement filed by non-management pursuant to Section 14(c) of the Securities Exchange Act of 1934";
  static readonly forms = ["DFRN14C"] as const;
}
