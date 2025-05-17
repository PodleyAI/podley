//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_DSTRBRPT extends Form {
  static readonly name = "Distribution Report";
  static readonly description = "Distribution of primary obligations Development Bank report.";
  static readonly forms = ["DSTRBRPT", "DSTRBRPT/A"] as const;
}
