//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DefaultValueType, FileKVRepository } from "@ellmers/storage";
import {
  TaskOutputPrimaryKeySchema,
  TaskOutputPrimaryKey,
  TaskOutputRepository,
} from "./TaskOutputRepository";

/**
 * File-based implementation of a task output repository.
 * Provides storage and retrieval for task outputs using a file system.
 */
export class FileTaskOutputRepository extends TaskOutputRepository {
  kvRepository: FileKVRepository<
    TaskOutputPrimaryKey,
    DefaultValueType,
    typeof TaskOutputPrimaryKeySchema
  >;
  public type = "FileTaskOutputRepository" as const;
  constructor(folderPath: string) {
    super();
    this.kvRepository = new FileKVRepository<
      TaskOutputPrimaryKey,
      DefaultValueType,
      typeof TaskOutputPrimaryKeySchema
    >(folderPath, TaskOutputPrimaryKeySchema);
  }
}
