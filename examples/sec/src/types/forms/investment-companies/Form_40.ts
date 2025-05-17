//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_40 extends Form {
  static readonly name = "Form 40";
  static readonly description = "Various forms under the Investment Company Act.";
  static readonly forms = [
    "40-APP",
    "40-APP/A",
    "40-6B",
    "40-6B/A",
    "40-6C",
    "40-6C/A",
    "40-F",
    "40-F/A",
    "40-33",
    "40-33/A",
    "40-24B2",
    "40-24B2/A",
    "40-17G",
    "40-17G/A",
    "40-17GCS",
    "40-17GCS/A",
    "4017GCS/A",
    "40-17F1",
    "40-17F1/A",
    "40-17F2",
    "40-17F2/A",
    "40-8F-2",
    "40-8F-2/A",
    "40-8B25",
    "40-8B25/A",
  ] as const;
}
