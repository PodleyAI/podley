//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_REG_NR extends Form {
  static readonly name = "Records for Non-Resident Brokers, Dealers, and Investment Advisers";
  static readonly description =
    "Initial Undertaking of Records for Non-Resident Brokers, Dealers, and Investment Advisers. It’s filed by a non-U.S. broker-dealer or investment adviser to appoint the SEC’s Secretary as agent for service of process and maintain required records in the U.S.";
  static readonly forms = ["REG NR", "REG NR/A", "REG-NR", "REG-NR/A"] as const;
}
