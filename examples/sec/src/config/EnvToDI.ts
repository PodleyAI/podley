//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { globalServiceRegistry } from "@ellmers/util";
import { SEC_DB_FOLDER, SEC_DB_NAME, SEC_RAW_DATA_FOLDER } from "../util/tokens";

export const EnvToDI = () => {
  // TODO(str): we should use dotenv to work on node
  if (process.env.SEC_RAW_DATA_FOLDER) {
    globalServiceRegistry.registerInstance(SEC_RAW_DATA_FOLDER, process.env.SEC_RAW_DATA_FOLDER);
  }
  if (process.env.SEC_DB_FOLDER) {
    globalServiceRegistry.registerInstance(SEC_DB_FOLDER, process.env.SEC_DB_FOLDER);
  }
  if (process.env.SEC_DB_NAME) {
    globalServiceRegistry.registerInstance(SEC_DB_NAME, process.env.SEC_DB_NAME);
  }
};
