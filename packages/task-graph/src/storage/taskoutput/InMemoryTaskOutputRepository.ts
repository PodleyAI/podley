//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { InMemoryTabularRepository } from "@ellmers/storage";
import {
  TaskOutputSchema,
  TaskOutputPrimaryKeyNames,
  TaskOutputRepository,
} from "./TaskOutputRepository";

/**
 * In-memory implementation of a task output repository.
 * Provides storage and retrieval for task outputs.
 */
export class InMemoryTaskOutputRepository extends TaskOutputRepository {
  tabularRepository: InMemoryTabularRepository<
    typeof TaskOutputSchema,
    typeof TaskOutputPrimaryKeyNames
  >;
  public type = "InMemoryTaskOutputRepository" as const;
  constructor() {
    super();
    this.tabularRepository = new InMemoryTabularRepository(
      TaskOutputSchema,
      TaskOutputPrimaryKeyNames
    );
  }
}
