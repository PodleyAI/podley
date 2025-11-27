/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { env } from "@sroussey/transformers";
import { HFT_WORKER_JOBRUN, HFT_WORKER_JOBRUN_REGISTER } from "@workglow/ai-provider";
import { globalServiceRegistry } from "@workglow/util";

env.backends.onnx.wasm.proxy = true;
globalServiceRegistry.get(HFT_WORKER_JOBRUN);
console.log("worker_htf loaded", HFT_WORKER_JOBRUN_REGISTER);
