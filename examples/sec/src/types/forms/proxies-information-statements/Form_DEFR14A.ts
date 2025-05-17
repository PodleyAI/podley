//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DEFR14A extends Form {
  static readonly name = "Definitive Revised Proxy Soliciting Materials";
  static readonly description =
    "Definitive revised proxy soliciting materials filed pursuant to Section 14(a) of the Securities Exchange Act of 1934";
  static readonly forms = ["DEFR14A"] as const;
}
