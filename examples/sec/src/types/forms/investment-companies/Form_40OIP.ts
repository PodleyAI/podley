//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_40OIP extends Form {
  static readonly name = "ICA Application (OIP Reviewed)";
  static readonly description =
    "Application under the Investment Company Act reviewed by the Office of Insurance Products.";
  static readonly forms = ["40-OIP", "40-OIP/A"] as const;
}
