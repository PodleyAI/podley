//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_G_FIN extends Form {
  static readonly name = "Government Securities";
  static readonly description =
    "Broker acting as government-securities brokers or dealers under the Government Securities Act of 1986.";
  static readonly forms = ["G-FIN", "G-FIN/A"] as const;
}
