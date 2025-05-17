//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_9M extends Form {
  static readonly name = "Irrevocable Appointment (Partnership Non-Resident B/D)";
  static readonly description =
    "Irrevocable Appointment by partnership non-resident broker or dealer.";
  static readonly forms = ["9-M"] as const;
}
