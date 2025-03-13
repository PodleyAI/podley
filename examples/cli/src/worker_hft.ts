//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  HFT_WORKER_JOBRUN,
  HFT_WORKER_JOBRUN_REGISTER,
} from "@ellmers/ai-provider/hf-transformers/worker";
import { globalServiceRegistry } from "@ellmers/util";

globalServiceRegistry.get(HFT_WORKER_JOBRUN);
console.log("worker_htf loaded", HFT_WORKER_JOBRUN_REGISTER);
