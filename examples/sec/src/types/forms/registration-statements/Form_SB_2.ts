//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_SB_2 extends Form {
  static readonly name = "Registration Statement (SB-2)";
  static readonly description =
    "Also an optional filing for small business issuers for the registration of securities to be sold to the public.";
  static readonly forms = ["SB-2", "SB-2/A", "SB-2MEF"] as const;
}
