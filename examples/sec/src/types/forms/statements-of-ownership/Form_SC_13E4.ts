//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SC_13E4 extends Form {
  static readonly name = "Tender Offer Statement";
  static readonly description =
    "This filing is made by a person making a tender offer for securities of a public company (now using Form SC TO-I).";
  static readonly forms = ["SC 13E4", "SC 13E4/A"] as const;
}
