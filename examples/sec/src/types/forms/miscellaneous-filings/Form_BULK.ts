//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_BULK extends Form {
  static readonly name = "Form BULK";
  static readonly description = "Bulk Submission.";
  static readonly forms = ["BULK", "BULK/A"] as const;
}
