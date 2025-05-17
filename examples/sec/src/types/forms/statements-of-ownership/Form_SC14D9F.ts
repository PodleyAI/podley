//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SC14D9F extends Form {
  static readonly name = "Statement on Tender Offer (Foreign Issuer)";
  static readonly description =
    "Solicitation/recommendation statement pursuant to Section 14(d)(4) of the Securities Exchange Act of 1934 and Rules 14d-1(b) and 14e-2(c) by foreign issuers.";
  static readonly forms = ["SC14D9F", "SC14D9F/A"] as const;
}
