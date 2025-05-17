//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_ARS extends Form {
  static readonly name = "Annual Report to Security Holders";
  static readonly description =
    "An annual report to security holders. This is a voluntary filing on EDGAR.";
  static readonly forms = ["ARS", "ARS/A"] as const;
}
