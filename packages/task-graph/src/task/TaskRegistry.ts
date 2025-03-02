//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { ITaskConstructor } from "./ITask";

const all = new Map<string, ITaskConstructor>();

const registerTask = (baseClass: ITaskConstructor<any, any, any>) => {
  all.set(baseClass.type, baseClass);
};

export const TaskRegistry = {
  registerTask,
  all,
};
