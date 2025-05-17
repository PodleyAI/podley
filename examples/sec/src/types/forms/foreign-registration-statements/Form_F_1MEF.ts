//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_1MEF extends Form {
  static readonly name = "F-1MEF";
  static readonly description = "Registration of additional securities for foreign private issuers";
  static readonly forms = ["F-1MEF"] as const;
}
