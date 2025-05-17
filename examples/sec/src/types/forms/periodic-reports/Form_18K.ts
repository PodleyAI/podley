//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_18K extends Form {
  static readonly name = "Annual Report for Foreign Governments";
  static readonly description = "Annual report for foreign governments and political subdivisions.";
  static readonly forms = ["18-K", "18-K/A"] as const;
}
