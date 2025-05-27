//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

// Since IndexedDb prefers to have the entire schema definded at once and not piecemeal,
// which is not what we need for caches for demos, we have a separate class for IndexedDb
// that simply adds a new database for each table. This will create if it doesn't already
// exist, and increments the version number.

export interface ExpectedIndexDefinition {
  name: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
}

export function ensureIndexedDbTable(
  tableName: string,
  primaryKey: string | string[],
  expectedIndexes: ExpectedIndexDefinition[] = []
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Close any existing connections first
    const closeRequest = indexedDB.open(tableName);
    closeRequest.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.close();
    };
    closeRequest.onerror = () => {
      console.error("Error closing database", closeRequest.error);
      reject(closeRequest.error);
    };

    // First try to open without version to check existing structure
    const checkRequest = indexedDB.open(tableName);

    checkRequest.onerror = () => {
      console.error("Error opening database", checkRequest.error);
      reject(checkRequest.error);
    };

    checkRequest.onsuccess = () => {
      const db = checkRequest.result;
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

      // Close existing connections before any reset
      db.close();

      if (needsReset) {
        // Delete the existing database
        const deleteRequest = indexedDB.deleteDatabase(tableName);
        deleteRequest.onerror = () => {
          console.error("Error deleting database", deleteRequest.error);
          reject(deleteRequest.error);
        };
        deleteRequest.onsuccess = () => {
          // Wait a small amount of time to ensure cleanup is complete
          setTimeout(() => {
            // Create new database with correct structure
            createNewDatabase();
          }, 50);
        };
      } else {
        // Structure is correct, reopen with same version
        const reopenRequest = indexedDB.open(tableName);
        reopenRequest.onerror = () => {
          console.error("Error reopening database", reopenRequest.error);
          reject(reopenRequest.error);
        };
        reopenRequest.onsuccess = () => {
          resolve(reopenRequest.result);
        };
      }
    };

    function createNewDatabase() {
      const request = indexedDB.open(tableName, 1);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const store = db.createObjectStore(tableName, { keyPath: primaryKey });

        // Create all indexes
        for (const idx of expectedIndexes) {
          store.createIndex(idx.name, idx.keyPath, idx.options);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error("Error creating database", request.error);
        reject(request.error);
      };
    }
  });
}
