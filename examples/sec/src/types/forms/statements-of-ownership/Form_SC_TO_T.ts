//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SC_TO_T extends Form {
  static readonly name = "Tender Offer Statement";
  static readonly description =
    "This filing is made by a person making a tender offer for securities of a public company.";
  static readonly forms = ["SC TO-T", "SC TO-T/A"] as const;
}
