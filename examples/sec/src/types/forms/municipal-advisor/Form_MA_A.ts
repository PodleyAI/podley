//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_MA_A extends Form {
  static readonly name = "Municipal Advisor Annual Update";
  static readonly description =
    "Annual update of municipal advisor registration under Section 15B(a)(2) of the Exchange Act.";
  static readonly forms = ["MA-A", "MA-A/A"] as const;
}
