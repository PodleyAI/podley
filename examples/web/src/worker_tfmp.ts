//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TFMP_WORKER_JOBRUN, TFMP_WORKER_JOBRUN_REGISTER } from "@podley/ai-provider";
import { globalServiceRegistry } from "@podley/util";

globalServiceRegistry.get(TFMP_WORKER_JOBRUN);
console.log("worker_tfmp loaded", TFMP_WORKER_JOBRUN_REGISTER);
