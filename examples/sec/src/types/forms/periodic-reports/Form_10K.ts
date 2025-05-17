//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_10K extends Form {
  static readonly name = "Annual Report";
  static readonly description =
    "An annual report which provides a comprehensive overview of the company for the past year. The filing is due 90 days after the close of the company's fiscal year, and contains information such as company history, organization, nature of business, equity, holdings, earnings per share, subsidiaries, and other pertinent financial information.";
  static readonly forms = ["10-K", "10-K/A"] as const;
}
