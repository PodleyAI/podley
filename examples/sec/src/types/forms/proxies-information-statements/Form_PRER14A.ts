//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_PRER14A extends Form {
  static readonly name = "Preliminary Revised Proxy Statement";
  static readonly description =
    "Preliminary revised proxy statement filed pursuant to Section 14(a) of the Securities Exchange Act of 1934";
  static readonly forms = ["PRER14A"] as const;
}
