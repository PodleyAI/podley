//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_C extends Form {
  static readonly name = "Offering Statement (Regulation Crowdfunding)";
  static readonly description = "Offering Statement (Regulation Crowdfunding)";
  static readonly forms = ["C", "C/A"] as const;
}
