//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_17HACON extends Form {
  static readonly name = "Confidential Broker-Dealer Annual 17-H Report";
  static readonly description = "Confidential broker-dealer annual 17-H report.";
  static readonly forms = ["17HACON", "17HACON/A"] as const;
}
