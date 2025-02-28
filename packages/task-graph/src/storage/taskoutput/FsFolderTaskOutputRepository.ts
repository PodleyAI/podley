//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { FsFolderTabularRepository } from "@ellmers/storage";
import {
  TaskOutputSchema,
  TaskOutputPrimaryKeyNames,
  TaskOutputRepository,
} from "./TaskOutputRepository";

/**
 * File system folder implementation of a task output repository.
 * Provides storage and retrieval for task outputs using the file system.
 */
export class FsFolderTaskOutputRepository extends TaskOutputRepository {
  tabularRepository: FsFolderTabularRepository<
    typeof TaskOutputSchema,
    typeof TaskOutputPrimaryKeyNames
  >;
  public type = "FsFolderTaskOutputRepository" as const;
  constructor(folderPath: string) {
    super();
    this.tabularRepository = new FsFolderTabularRepository(
      folderPath,
      TaskOutputSchema,
      TaskOutputPrimaryKeyNames
    );
  }
}
