//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NSARAT extends Form {
  static readonly name = "Transitional Semi-Annual Report for Management Companies";
  static readonly description =
    "Transitional semi-annual report for registered investment companies (Management).";
  static readonly forms = ["NSAR-AT", "NSAR-AT/A"] as const;
}
