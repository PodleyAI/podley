//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_PREA14A extends Form {
  static readonly name = "Additional Preliminary Proxy Statement";
  static readonly description =
    "Additional preliminary proxy-soliciting materials filed pursuant to Section 14(a) of the Securities Exchange Act of 1934";
  static readonly forms = ["PREA14A"] as const;
}
