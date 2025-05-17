//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_13F_HR extends Form {
  static readonly name = "13F Holdings Report";
  static readonly description = "13F Holdings Report Initial Filing.";
  static readonly forms = ["13F-HR", "13F-HR/A"] as const;
}
