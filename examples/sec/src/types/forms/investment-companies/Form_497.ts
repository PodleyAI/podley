//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_497 extends Form {
  static readonly name = "Definitive Materials";
  static readonly description = "Definitive materials filed by investment companies";
  static readonly forms = [
    "497",
    "497/A",
    "497AD",
    "497AD/A",
    "497J",
    "497J/A",
    "497K",
    "497K/A",
    "497K1",
    "497K1/A",
    "497VPI",
    "497VPI/A",
    "497VPSUB",
    "497VPSUB/A",
    "497VPU",
    "497VPU/A",
    "497H2",
    "497H2/A",
  ] as const;
}
