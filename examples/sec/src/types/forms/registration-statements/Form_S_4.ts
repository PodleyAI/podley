//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_S_4 extends Form {
  static readonly name = "Registration Statement (S-4)";
  static readonly description =
    "This filing is for the registration of securities issued in business combination transactions.";
  static readonly forms = ["S-4", "S-4/A", "S-4EF", "S-4EF/A", "S-4 POS", "S-4MEF"] as const;
}
