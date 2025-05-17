//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_PRE13E3 extends Form {
  static readonly name = "Initial Statement Preliminary";
  static readonly description = "Initial statement - preliminary form.";
  static readonly forms = ["PRE13E3", "PRE13E3/A"] as const;
}
