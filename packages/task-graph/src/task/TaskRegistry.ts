//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SingleTask } from "./SingleTask";
import { CompoundTask } from "./CompoundTask";

const all = new Map<string, typeof SingleTask | typeof CompoundTask>();

const registerTask = (baseClass: any) => {
  all.set(baseClass.type, baseClass);
};

export const TaskRegistry = {
  registerTask,
  all,
};
