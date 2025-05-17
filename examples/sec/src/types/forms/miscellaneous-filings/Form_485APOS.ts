//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_485APOS extends Form {
  static readonly name = "Post-Effective Amendment to Registration Statement";
  static readonly description =
    "Post-effective amendment to registration statement filed pursuant to Rule 485(a) under the Securities Act of 1933";
  static readonly forms = ["485APOS"] as const;
}
