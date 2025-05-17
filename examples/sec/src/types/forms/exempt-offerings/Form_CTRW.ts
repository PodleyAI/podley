//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_CTRW extends Form {
  static readonly name = "Termination of Reporting Withdrawal (Regulation Crowdfunding)";
  static readonly description = "Termination of Reporting Withdrawal";
  static readonly forms = ["C-TR-W"] as const;
}
