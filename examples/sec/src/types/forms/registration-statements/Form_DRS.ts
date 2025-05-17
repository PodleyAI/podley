//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DRS extends Form {
  static readonly name = "Registration Statement (DRS)";
  static readonly description = "Registration statement for direct registration system securities.";
  static readonly forms = ["DRS", "DRS/A", "DRSLTR"] as const;
}
