//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_REGDEX extends Form {
  static readonly name = "Notice of Sale (Regulation D / Section 4(6))";
  static readonly description =
    "Notice of sale of securities under Regulation D and Section 4(6) of the Securities Act.";
  static readonly forms = ["REGDEX", "REGDEX/A"] as const;
}
