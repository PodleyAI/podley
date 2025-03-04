//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken } from "@ellmers/util";
import { IKvRepository } from "../kv/IKvRepository";
import { IQueueStorage } from "../queue/IQueueStorage";
import { ITabularRepository } from "../tabular/ITabularRepository";

// Generic
export const KV_REPOSITORY =
  createServiceToken<IKvRepository<any, any, any>>("storage.kvRepository");
export const QUEUE_STORAGE = createServiceToken<IQueueStorage<any, any>>("storage.queueStorage");
export const TABULAR_REPOSITORY = createServiceToken<ITabularRepository<any>>(
  "storage.tabularRepository"
);

// Tabular Actual Repositories
export const IDB_TABULAR_REPOSITORY = createServiceToken<ITabularRepository<any>>(
  "storage.tabularRepository.indexedDb"
);
export const MEMORY_TABULAR_REPOSITORY = createServiceToken<ITabularRepository<any>>(
  "storage.tabularRepository.inMemory"
);
export const POSTGRES_TABULAR_REPOSITORY = createServiceToken<ITabularRepository<any>>(
  "storage.tabularRepository.postgres"
);
export const SQLITE_TABULAR_REPOSITORY = createServiceToken<ITabularRepository<any>>(
  "storage.tabularRepository.sqlite"
);
export const FS_FOLDER_TABULAR_REPOSITORY = createServiceToken<ITabularRepository<any>>(
  "storage.tabularRepository.fsFolder"
);

// KV Actual Repositories
export const FS_FOLDER_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.fsFolder"
);
export const IDB_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.indexedDb"
);
export const MEMORY_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.inMemory"
);
export const POSTGRES_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.postgres"
);
export const SQLITE_KV_REPOSITORY = createServiceToken<IKvRepository<string, any, any>>(
  "storage.kvRepository.sqlite"
);

// Queue Actual Repositories
export const IDB_QUEUE_STORAGE = createServiceToken<IQueueStorage<string, any>>(
  "storage.queueStorage.indexedDb"
);
export const MEMORY_QUEUE_STORAGE = createServiceToken<IQueueStorage<string, any>>(
  "storage.queueStorage.inMemory"
);
export const POSTGRES_QUEUE_STORAGE = createServiceToken<IQueueStorage<string, any>>(
  "storage.queueStorage.postgres"
);
export const SQLITE_QUEUE_STORAGE = createServiceToken<IQueueStorage<string, any>>(
  "storage.queueStorage.sqlite"
);
