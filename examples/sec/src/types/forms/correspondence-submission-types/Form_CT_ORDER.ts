//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_CT_ORDER extends Form {
  static readonly name = "Court Order Affecting SEC Filings";
  static readonly description = "Court order affecting SEC filings.";
  static readonly forms = ["CT ORDER"] as const;
}
