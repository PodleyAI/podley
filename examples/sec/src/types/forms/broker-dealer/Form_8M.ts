//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_8M extends Form {
  static readonly name = "Irrevocable Appointment (Corporate Non-Resident B/D)";
  static readonly description =
    "Irrevocable Appointment of Agent for Service of Process by corporate non-resident broker or dealer.";
  static readonly forms = ["8-M"] as const;
}
