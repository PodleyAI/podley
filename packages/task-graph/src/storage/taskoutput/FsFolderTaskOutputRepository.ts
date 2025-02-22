//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DefaultValueType, FsFolderTabularRepository } from "@ellmers/storage";
import {
  TaskOutputPrimaryKeySchema,
  TaskOutputPrimaryKey,
  TaskOutputRepository,
} from "./TaskOutputRepository";

/**
 * File-based implementation of a task output repository.
 * Provides storage and retrieval for task outputs using a file system.
 */
export class FsFolderTaskOutputRepository extends TaskOutputRepository {
  tabularRepository: FsFolderTabularRepository<
    TaskOutputPrimaryKey,
    DefaultValueType,
    typeof TaskOutputPrimaryKeySchema
  >;
  public type = "FsFolderTaskOutputRepository" as const;
  constructor(folderPath: string) {
    super();
    this.tabularRepository = new FsFolderTabularRepository<
      TaskOutputPrimaryKey,
      DefaultValueType,
      typeof TaskOutputPrimaryKeySchema
    >(folderPath, TaskOutputPrimaryKeySchema);
  }
}
