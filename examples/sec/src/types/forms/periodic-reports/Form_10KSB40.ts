//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_10KSB40 extends Form {
  static readonly name = "Annual Report for Small Businesses (Item 405 Box Checked)";
  static readonly description =
    "An optional form for annual and transition reports of small business issuers under Section 13 or 15(d) of the Securities Exchange Act where the Regulation S-B Item 405 box on the cover page is checked.";
  static readonly forms = ["10KSB40", "10KSB40/A"] as const;
}
