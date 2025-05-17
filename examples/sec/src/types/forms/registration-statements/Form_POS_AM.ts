//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_POS_AM extends Form {
  static readonly name = "Post-effective Amendment (POS AM)";
  static readonly description = "Post-effective amendment to a registration statement.";
  static readonly forms = ["POS AM"] as const;
}
