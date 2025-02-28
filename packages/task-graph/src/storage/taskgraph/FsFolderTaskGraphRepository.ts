//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  DefaultPrimaryKeySchema,
  DefaultPrimaryKeyType,
  DefaultValueSchema,
  DefaultValueType,
  FsFolderTabularRepository,
} from "@ellmers/storage";
import { TaskGraphRepository } from "./TaskGraphRepository";

/**
 * File-based implementation of a task graph repository.
 * Provides storage and retrieval for task graphs using a file system.
 */
export class FsFolderTaskGraphRepository extends TaskGraphRepository {
  tabularRepository: FsFolderTabularRepository<
    DefaultPrimaryKeyType,
    DefaultValueType,
    typeof DefaultPrimaryKeySchema,
    typeof DefaultValueSchema
  >;
  public type = "FsFolderTaskGraphRepository" as const;
  constructor(folderPath: string) {
    super();
    this.tabularRepository = new FsFolderTabularRepository(
      folderPath,
      DefaultPrimaryKeySchema,
      DefaultValueSchema
    );
  }
}
