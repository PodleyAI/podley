//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_10K405 extends Form {
  static readonly name = "Annual Report (Item 405 Box Checked)";
  static readonly description =
    "An annual report which provides a comprehensive overview of the company for the past year. The Regulation S-K Item 405 box on the cover page is checked.";
  static readonly forms = ["10-K405", "10-K405/A"] as const;
}
