//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SC_13G extends Form {
  static readonly name = "Beneficial Ownership Statement";
  static readonly description =
    "This filing is made by person(s) reporting beneficially owned shares of common stock in a public company.";
  static readonly forms = ["SC 13G", "SC 13G/A", "SCHEDULE 13G", "SCHEDULE 13G/A"] as const;
}
