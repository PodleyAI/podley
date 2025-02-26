//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SingleTask } from "./SingleTask";

/**
 * Output tasks have side effects, and so need to always run and not be cached
 */
export class OutputTask extends SingleTask {
  static readonly category = "Output";
  static readonly sideeffects = true;
}
