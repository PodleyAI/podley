//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_CORRESP extends Form {
  static readonly name = "Correspondence Submission";
  static readonly description =
    "Correspondence - submission to SEC staff; not immediately public, may be released later.";
  static readonly forms = ["CORRESP"] as const;
}
