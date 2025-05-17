//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_424B8 extends Form {
  static readonly name = "Prospectus Filed Pursuant to Rule 424(b)(8)";
  static readonly description =
    "A prospectus filed pursuant to Rule 424(b)(8) under the Securities Act of 1933";
  static readonly forms = ["424B8"] as const;
}
