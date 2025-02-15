//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskInput } from "./Task";
import { SingleTask } from "./SingleTask";

/**
 * Output tasks have side effects, and so need to always run and not be cached
 */
export class OutputTask extends SingleTask {
  static readonly category = "Output";
  provenance: TaskInput = {};
  static readonly sideeffects = true;
  async run(provenance: TaskInput = {}) {
    this.provenance = provenance;
    return super.run();
  }
}
