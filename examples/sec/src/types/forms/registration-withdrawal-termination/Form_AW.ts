//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_AW extends Form {
  static readonly name = "Withdrawal of Amendment";
  static readonly description =
    "Withdraws an amendment to a registration statement that had been filed under the Securities Act.";
  static readonly forms = ["AW", "AW WD"] as const; // AW WD (Withdrawal of a Withdrawal-of-Amendment Request)
}
