//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskGraphRepository } from "./TaskGraphRepository";
import { IndexedDbTabularRepository } from "@ellmers/storage";

/**
 * IndexedDB implementation of a task graph repository.
 * Provides storage and retrieval for task graphs using IndexedDB.
 */
export class IndexedDbTaskGraphRepository extends TaskGraphRepository {
  tabularRepository: IndexedDbTabularRepository;
  public type = "IndexedDbTaskGraphRepository" as const;
  constructor(table: string = "task_graphs") {
    super();
    this.tabularRepository = new IndexedDbTabularRepository(table);
  }
}
