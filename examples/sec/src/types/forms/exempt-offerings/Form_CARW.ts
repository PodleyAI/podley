//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_CARW extends Form {
  static readonly name = "Annual Report Withdrawal (Regulation Crowdfunding)";
  static readonly description = "Annual Report Withdrawal";
  static readonly forms = ["C-AR-W", "C-AR/A-W"] as const;
}
