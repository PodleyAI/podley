//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_7M extends Form {
  static readonly name = "Irrevocable Appointment (Individual Non-Resident B/D)";
  static readonly description =
    "Irrevocable Appointment by individual non-resident broker or dealer.";
  static readonly forms = ["7-M"] as const;
}
