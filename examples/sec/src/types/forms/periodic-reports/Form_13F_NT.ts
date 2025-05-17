//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_13F_NT extends Form {
  static readonly name = "13F Notice Report";
  static readonly description = "13F Notice Report Initial Filing.";
  static readonly forms = ["13F-NT", "13F-NT/A"] as const;
}
