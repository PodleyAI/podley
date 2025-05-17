//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SE extends Form {
  static readonly name = "Submission of Paper-Format Exhibits by Electronic Filers";
  static readonly description = "Submission of paper-format exhibits by electronic filers.";
  static readonly forms = ["SE"] as const;
}
