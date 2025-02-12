//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DefaultValueType, InMemoryKVRepository } from "@ellmers/storage";
import { TaskOutputPrimaryKeySchema } from "./TaskOutputRepository";
import { TaskOutputPrimaryKey } from "./TaskOutputRepository";
import { TaskOutputRepository } from "./TaskOutputRepository";

/**
 * In-memory implementation of a task output repository.
 * Provides storage and retrieval for task outputs.
 */
export class InMemoryTaskOutputRepository extends TaskOutputRepository {
  kvRepository: InMemoryKVRepository<
    TaskOutputPrimaryKey,
    DefaultValueType,
    typeof TaskOutputPrimaryKeySchema
  >;
  public type = "InMemoryTaskOutputRepository" as const;
  constructor() {
    super();
    this.kvRepository = new InMemoryKVRepository<
      TaskOutputPrimaryKey,
      DefaultValueType,
      typeof TaskOutputPrimaryKeySchema
    >(TaskOutputPrimaryKeySchema);
  }
}
