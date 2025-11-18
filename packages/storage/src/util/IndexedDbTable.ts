/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

// Since IndexedDb prefers to have the entire schema definded at once and not piecemeal,
// which is not what we need for caches for demos, we have a separate class for IndexedDb
// that simply adds a new database for each table. This will create if it doesn't already
// exist, and increments the version number.

export interface ExpectedIndexDefinition {
  name: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
}

async function createNewDatabase(
  tableName: string,
  primaryKey: string | string[],
  expectedIndexes: ExpectedIndexDefinition[],
  version: number = 1
): Promise<IDBDatabase> {
  const db = await openIndexedDbTable(tableName, version, (event: IDBVersionChangeEvent) => {
    const db = (event.target as IDBOpenDBRequest).result;
    const store = db.createObjectStore(tableName, { keyPath: primaryKey });
    for (const idx of expectedIndexes) {
      store.createIndex(idx.name, idx.keyPath, idx.options);
    }
  });

  return db;
}

async function openIndexedDbTable(
  tableName: string,
  version?: number,
  upgradeNeededCallback?: (event: IDBVersionChangeEvent) => void
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(tableName, version);
    openRequest.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    openRequest.onupgradeneeded = (event) => {
      if (upgradeNeededCallback) {
        upgradeNeededCallback(event);
      }
    };
    openRequest.onerror = (e) => reject((e.target as any).error);
    openRequest.onblocked = (e) => reject((e.target as any).error);
  });
}

async function deleteIndexedDbTable(tableName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(tableName);
    deleteRequest.onerror = (e) => reject((e.target as any).error);
    deleteRequest.onblocked = (e) => reject((e.target as any).error);
    deleteRequest.onsuccess = () => {
      resolve(void 0);
    };
  });
}

export async function ensureIndexedDbTable(
  tableName: string,
  primaryKey: string | string[],
  expectedIndexes: ExpectedIndexDefinition[] = []
): Promise<IDBDatabase> {
  const returnDb = await new Promise<IDBDatabase>(async (resolve, reject) => {
    const db = await openIndexedDbTable(tableName);
    let needsReset = false;

    // Check if table structure matches expected
    if (!db.objectStoreNames.contains(tableName)) {
      needsReset = true;
    } else {
      try {
        const transaction = db.transaction(tableName, "readonly");
        const store = transaction.objectStore(tableName);

        // Check primary key
        const actualKeyPath = store.keyPath;
        const expectedKeyPath = Array.isArray(primaryKey) ? primaryKey : primaryKey;
        if (JSON.stringify(actualKeyPath) !== JSON.stringify(expectedKeyPath)) {
          needsReset = true;
        }

        // Check indexes
        if (!needsReset && expectedIndexes.length > 0) {
          for (const expectedIdx of expectedIndexes) {
            if (!store.indexNames.contains(expectedIdx.name)) {
              needsReset = true;
              break;
            }
            const existingIdx = store.index(expectedIdx.name);

            // Compare keyPath
            const expectedKeyPath = Array.isArray(expectedIdx.keyPath)
              ? expectedIdx.keyPath
              : [expectedIdx.keyPath];
            const actualKeyPath = Array.isArray(existingIdx.keyPath)
              ? existingIdx.keyPath
              : [existingIdx.keyPath];
            if (JSON.stringify(expectedKeyPath) !== JSON.stringify(actualKeyPath)) {
              needsReset = true;
              break;
            }

            // Compare options
            if (
              existingIdx.unique !== (expectedIdx.options?.unique ?? false) ||
              existingIdx.multiEntry !== (expectedIdx.options?.multiEntry ?? false)
            ) {
              needsReset = true;
              break;
            }
          }
        }
      } catch (err) {
        needsReset = true;
      }
    }

    if (needsReset) {
      // Close existing connections before any reset
      db.close();
      await deleteIndexedDbTable(tableName);
      const newDb = await createNewDatabase(tableName, primaryKey, expectedIndexes);
      resolve(newDb);
    } else {
      resolve(db);
    }
  });
  return returnDb;
}
