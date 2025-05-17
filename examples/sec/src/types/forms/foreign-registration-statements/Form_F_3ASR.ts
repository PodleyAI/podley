//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_3ASR extends Form {
  static readonly name = "F-3ASR";
  static readonly description =
    "Automatic shelf registration statement for foreign private issuers";
  static readonly forms = ["F-3ASR", "F-3ASR/A"] as const;
}
