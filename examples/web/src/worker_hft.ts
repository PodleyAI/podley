//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { HFT_WORKER_JOBRUN, HFT_WORKER_JOBRUN_REGISTER } from "@ellmers/ai-provider";
import { globalServiceRegistry } from "@ellmers/util";
import { env } from "@huggingface/transformers";

env.backends.onnx.wasm.proxy = true;
globalServiceRegistry.get(HFT_WORKER_JOBRUN);
console.log("worker_htf loaded", HFT_WORKER_JOBRUN_REGISTER);
