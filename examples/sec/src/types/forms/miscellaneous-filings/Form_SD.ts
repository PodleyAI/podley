//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SD extends Form {
  static readonly name = "Form SD";
  static readonly description =
    "Specialized disclosure report pursuant to Section 13(r) of the Exchange Act.";
  static readonly forms = ["SD", "SD/A"] as const;
}
