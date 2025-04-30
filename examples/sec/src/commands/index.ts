//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Command } from "commander";
import { EnvToDI } from "../config/EnvToDI";
import { BootstrapAllCikNames } from "./BootstrapAllCikNames";
import { BootstrapCikLastUpdate } from "./BootstrapCikLastUpdate";
import { CompanyFacts } from "./CompanyFacts";
import { CompanySubmissions } from "./CompanySubmissions";
import { AddDailyIndexCommands } from "./DailyIndex";
import { SetupDB } from "./SetupDB";

export const AddCommands = (program: Command) => {
  EnvToDI();
  AddDailyIndexCommands(program);
  BootstrapAllCikNames(program);
  BootstrapCikLastUpdate(program);
  CompanyFacts(program);
  CompanySubmissions(program);
  SetupDB(program);
};
