//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_RW extends Form {
  static readonly name = "Registration Withdrawal Request";
  static readonly description =
    "Request for a withdrawal of a previously filed registration statement.";
  static readonly forms = ["RW", "RW WD"] as const; // RW WD (Withdrawal of a Registration Withdrawal Request)
}
