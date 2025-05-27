//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { HFT_WORKER_JOBRUN, HFT_WORKER_JOBRUN_REGISTER } from "@podley/ai-provider";
import { globalServiceRegistry } from "@podley/util";
import { env } from "@sroussey/transformers";

env.backends.onnx.wasm.proxy = true;
globalServiceRegistry.get(HFT_WORKER_JOBRUN);
console.log("worker_htf loaded", HFT_WORKER_JOBRUN_REGISTER);
