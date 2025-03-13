//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  TFMP_WORKER_JOBRUN,
  TFMP_WORKER_JOBRUN_REGISTER,
} from "@ellmers/ai-provider/tf-mediapipe/worker";
import { globalServiceRegistry } from "@ellmers/util";

globalServiceRegistry.get(TFMP_WORKER_JOBRUN);
console.log("worker_tfmp loaded", TFMP_WORKER_JOBRUN_REGISTER);
