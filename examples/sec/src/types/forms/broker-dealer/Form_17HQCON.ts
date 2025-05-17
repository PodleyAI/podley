//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_17HQCON extends Form {
  static readonly name = "Confidential Broker-Dealer Quarterly 17-H Report";
  static readonly description = "Confidential broker-dealer quarterly 17-H report.";
  static readonly forms = ["17HQCON", "17HQCON/A"] as const;
}
