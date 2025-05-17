//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_ATS_N extends Form {
  static readonly name = "Initial Form ATS-N";
  static readonly description = "Initial Form ATS-N (Rule 304(a)(1)(i)).";
  static readonly forms = [
    "ATS-N",
    "ATS-N/CA",
    "ATS-N/MA",
    "ATS-N/OFA",
    "ATS-N/UA",
    "ATS-N-C",
    "ATS-N-W",
  ] as const;
}
