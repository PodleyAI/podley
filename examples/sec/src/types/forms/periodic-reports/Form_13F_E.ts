//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_13F_E extends Form {
  static readonly name = "Institutional Managers Quarterly Report";
  static readonly description = "Quarterly reports filed by institutional managers.";
  static readonly forms = ["13F-E", "13F-E/A"] as const;
}
