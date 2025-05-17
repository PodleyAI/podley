//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_F_N extends Form {
  static readonly name = "F-N";
  static readonly description = "Appointment of agent for service of process by foreign issuers";
  static readonly forms = ["F-N", "F-N/A"] as const;
}
