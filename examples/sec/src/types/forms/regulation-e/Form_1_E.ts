//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_1_E extends Form {
  static readonly name = "Notification under Regulation E";
  static readonly description =
    "Notification under Regulation E by small business investment companies and business development companies.";
  static readonly forms = ["1-E", "1-E/A"] as const;
}
