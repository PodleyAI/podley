//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_ABS_EE extends Form {
  static readonly name = "Electronic Exhibits for Asset-Backed Securities";
  static readonly description =
    "Form for Submission of Electronic Exhibits in asset-backed securities offerings.";
  static readonly forms = ["ABS-EE", "ABS-EE/A"] as const;
}
