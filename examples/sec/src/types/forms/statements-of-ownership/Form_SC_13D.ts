//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SC_13D extends Form {
  static readonly name = "Beneficial Ownership Statement";
  static readonly description =
    "This filing is made by person(s) reporting beneficially owned shares of common stock in a public company.";
  static readonly forms = ["SC 13D", "SC 13D/A", "SCHEDULE 13D", "SCHEDULE 13D/A"] as const;
}
