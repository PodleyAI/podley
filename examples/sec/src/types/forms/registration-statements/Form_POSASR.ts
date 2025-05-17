//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_POSASR extends Form {
  static readonly name = "Post-Effective Amendment to Automatic Shelf Registration Statement";
  static readonly description =
    "Post-effective amendment to automatic shelf registration statement pursuant to Rule 415 under the Securities Act of 1933";
  static readonly forms = ["POSASR", "POSASR/A"] as const;
}
