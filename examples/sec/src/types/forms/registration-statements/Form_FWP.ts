//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_FWP extends Form {
  static readonly name = "Free Writing Prospectus";
  static readonly description =
    "A free writing prospectus filed pursuant to Rule 433 under the Securities Act of 1933";
  static readonly forms = ["FWP"] as const;
}
