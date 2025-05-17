//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_CU extends Form {
  static readonly name = "Progress Update (Regulation Crowdfunding)";
  static readonly description = "Progress Update";
  static readonly forms = ["C-U"] as const;
}
