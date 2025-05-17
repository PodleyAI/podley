//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_CAR extends Form {
  static readonly name = "Annual Report (Regulation Crowdfunding)";
  static readonly description = "Annual Report";
  static readonly forms = ["C-AR", "C-AR/A"] as const;
}
