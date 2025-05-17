//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_5 extends Form {
  static readonly name = "Annual Statement of Beneficial Ownership";
  static readonly description =
    "An annual statement of ownership of securities filed by every director, officer, or owner of more than ten percent of a class of equity securities.";
  static readonly forms = ["5", "5/A"] as const;
}
