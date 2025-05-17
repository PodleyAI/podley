//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_APP_NTC extends Form {
  static readonly name = "Application Notice";
  static readonly description = "Application notice under the Investment Company Act of 1940.";
  static readonly forms = ["APP NTC"] as const;
}
