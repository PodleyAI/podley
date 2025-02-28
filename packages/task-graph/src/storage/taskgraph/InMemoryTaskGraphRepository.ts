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
  InMemoryTabularRepository,
} from "@ellmers/storage";
import { TaskGraphRepository } from "./TaskGraphRepository";

/**
 * In-memory implementation of a task graph repository.
 * Provides storage and retrieval for task graphs.
 */
export class InMemoryTaskGraphRepository extends TaskGraphRepository {
  tabularRepository: InMemoryTabularRepository<
    DefaultPrimaryKeyType,
    DefaultValueType,
    typeof DefaultPrimaryKeySchema,
    typeof DefaultValueSchema
  >;
  public type = "InMemoryTaskGraphRepository" as const;
  constructor() {
    super();
    this.tabularRepository = new InMemoryTabularRepository(
      DefaultPrimaryKeySchema,
      DefaultValueSchema
    );
  }
}
