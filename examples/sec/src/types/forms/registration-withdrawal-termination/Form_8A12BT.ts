//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_8A12BT extends Form {
  static readonly name = "Registration of Securities on Form 8-A";
  static readonly description =
    "Registration of securities pursuant to Section 12(b) of the Securities Exchange Act of 1934 for trust indentures";
  static readonly forms = ["8A12BT", "8A12BT/A"] as const;
}
