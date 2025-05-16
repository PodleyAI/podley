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
import { UpdateAllCompanyFacts } from "./UpdateAllCompanyFacts";
import { SecJobQueue } from "../fetch/SecJobQueue";
import { getTaskQueueRegistry } from "@ellmers/task-graph";
import { UpdateAllSubmissions } from "./UpdateAllSubmissions";

export const AddCommands = (program: Command) => {
  EnvToDI();
  getTaskQueueRegistry().registerQueue(SecJobQueue);
  SecJobQueue.start();
  AddDailyIndexCommands(program);
  BootstrapAllCikNames(program);
  BootstrapCikLastUpdate(program);
  CompanyFacts(program);
  CompanySubmissions(program);
  SetupDB(program);
  UpdateAllCompanyFacts(program);
  UpdateAllSubmissions(program);
};
