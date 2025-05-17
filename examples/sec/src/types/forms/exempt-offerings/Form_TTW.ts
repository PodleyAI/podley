//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_TTW extends Form {
  static readonly name = "Reg-A Test The Waters";
  static readonly description =
    "“Test The Waters” submission under Regulation A, filed by an issuer to gauge investor interest in a potential exempt offering before formally qualifying the offering statement.";
  static readonly forms = ["TTW"] as const;
}
