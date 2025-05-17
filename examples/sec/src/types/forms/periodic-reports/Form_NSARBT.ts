//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NSARBT extends Form {
  static readonly name = "Transitional Annual Report for Management Companies";
  static readonly description = "Transitional annual report for management companies.";
  static readonly forms = ["NSAR-BT", "NSAR-BT/A"] as const;
}
