//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_ADV_NR extends Form {
  static readonly name = "Appointment of Agent for Service of Process";
  static readonly description =
    "Appointment of agent for service of process by a non-resident general partner or managing agent of an investment adviser.";
  static readonly forms = ["ADV-NR"] as const;
}
