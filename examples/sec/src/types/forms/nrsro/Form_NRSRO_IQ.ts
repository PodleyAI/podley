//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NRSRO_IQ extends Form {
  static readonly name = "NRSRO Annual Certification of Internal Controls";
  static readonly description = "Annual certification of internal controls for NRSROs.";
  static readonly forms = ["NRSRO-IQ", "NRSRO-IQ/A"] as const;
}
