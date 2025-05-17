//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SC14D1F extends Form {
  static readonly name = "Tender Offer Statement (Foreign Issuer)";
  static readonly description =
    "Third party tender offer statement filed pursuant to Rule 14d-1(b) by foreign issuers.";
  static readonly forms = ["SC14D1F", "SC14D1F/A"] as const;
}
