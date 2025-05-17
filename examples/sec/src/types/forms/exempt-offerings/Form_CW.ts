//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_CW extends Form {
  static readonly name = "Offering Statement Withdrawal (Regulation Crowdfunding)";
  static readonly description = "Offering Statement Withdrawal";
  static readonly forms = ["C-W", "C/A-W"] as const;
}
