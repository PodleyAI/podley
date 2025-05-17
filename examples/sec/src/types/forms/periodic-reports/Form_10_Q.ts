//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_10_Q extends Form {
  static readonly name = "Quarterly Report";
  static readonly description =
    "A quarterly report which provides a continuing view of a company's financial position during the year. The filing is due 45 days after each of the first three fiscal quarters. No filing is due for the fourth quarter.";
  static readonly forms = ["10-Q", "10-Q/A"] as const;
}
