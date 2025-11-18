/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { HFT_WORKER_JOBRUN, HFT_WORKER_JOBRUN_REGISTER } from "@podley/ai-provider";
import { globalServiceRegistry } from "@podley/util";
import { env } from "@sroussey/transformers";

env.backends.onnx.wasm.proxy = true;
globalServiceRegistry.get(HFT_WORKER_JOBRUN);
console.log("worker_htf loaded", HFT_WORKER_JOBRUN_REGISTER);
