//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_1ZW extends Form {
  static readonly name = "Withdrawal of Exit Report (Regulation A)";
  static readonly description = "Withdrawal of exit report under Regulation A.";
  static readonly forms = ["1-Z-W", "1-Z-W/A"] as const;
}
