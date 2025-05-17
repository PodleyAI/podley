//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NRSRO_WP extends Form {
  static readonly name = "NRSRO Annual Report";
  static readonly description = "Annual report for NRSROs regarding their performance.";
  static readonly forms = ["NRSRO-WP", "NRSRO-WP/A"] as const;
}
