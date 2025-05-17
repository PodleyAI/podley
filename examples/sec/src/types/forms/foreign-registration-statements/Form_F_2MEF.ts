//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_2MEF extends Form {
  static readonly name = "F-2MEF";
  static readonly description =
    "Registration of additional securities for foreign private issuers with substantial U.S. market interest";
  static readonly forms = ["F-2MEF"] as const;
}
