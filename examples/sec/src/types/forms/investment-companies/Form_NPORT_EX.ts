//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_NPORT_EX extends Form {
  static readonly name = "Portfolio Holdings Exhibit";
  static readonly description = "Portfolio Holdings Exhibit to Form N-PORT.";
  static readonly forms = ["NPORT-EX", "NPORT-EX/A", "NT NPORT-EX"] as const;
}
