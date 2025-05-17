//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_POS_8C extends Form {
  static readonly name = "Post-Effective Amendment to Registration Statement";
  static readonly description =
    "Post-effective amendment to registration statement filed pursuant to Section 8(c) of the Investment Company Act of 1940";
  static readonly forms = ["POS 8C"] as const;
}
