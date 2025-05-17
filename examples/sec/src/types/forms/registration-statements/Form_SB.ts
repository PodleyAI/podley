//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SB extends Form {
  static readonly name = "Registration Statement (SB)";
  static readonly description =
    "Registration statement for securities of foreign governments and subdivisions thereof under the Securities Act of 1933 (Schedule B).";
  static readonly forms = ["SB"] as const;
}
