//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_CUW extends Form {
  static readonly name = "Progress Update Withdrawal (Regulation Crowdfunding)";
  static readonly description = "Progress Update Withdrawal";
  static readonly forms = ["C-U-W"] as const;
}
