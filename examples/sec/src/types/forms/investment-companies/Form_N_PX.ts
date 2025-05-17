//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_N_PX extends Form {
  static readonly name = "Annual Report of Proxy Voting Record";
  static readonly description =
    "Annual Report of Proxy Voting Record of Registered Management Investment Companies filed on Form N-PX.";
  static readonly forms = [
    "N-PX",
    "N-PX/A",
    "N-PX-CR",
    "N-PX-CR/A",
    "N-PX-FM",
    "N-PX-FM/A",
    "N-PX-NT",
    "N-PX-NT/A",
    "N-PX-VR",
    "N-PX-VR/A",
  ] as const;
}
