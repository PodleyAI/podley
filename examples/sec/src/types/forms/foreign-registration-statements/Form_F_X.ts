//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_X extends Form {
  static readonly name = "Appointment of Agent for Service of Process";
  static readonly description =
    "Appointment of agent for service of process by foreign issuers pursuant to Rule 489 under the Securities Act of 1933";
  static readonly forms = ["F-X", "F-X/A"] as const;
}
