/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { TFMP_WORKER_JOBRUN, TFMP_WORKER_JOBRUN_REGISTER } from "@workglow/ai-provider";
import { globalServiceRegistry } from "@workglow/util";

globalServiceRegistry.get(TFMP_WORKER_JOBRUN);
console.log("worker_tfmp loaded", TFMP_WORKER_JOBRUN_REGISTER);
