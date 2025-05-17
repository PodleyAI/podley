//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_CEN extends Form {
  static readonly name = "Annual Report";
  static readonly description = "Annual Report for Registered Investment Companies";
  static readonly forms = ["N-CEN", "N-CEN/A", "NT N-CEN", "NT N-CEN/A", "NTFNCEN"] as const;
}
