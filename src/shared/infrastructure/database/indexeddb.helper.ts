// IndexedDB Helper for managing database operations
export class IndexedDBHelper {
  private dbName: string;
  private version: number;
  private stores: { name: string; keyPath?: string; indexes?: { name: string; keyPath: string; unique?: boolean }[] }[];

  constructor(
    dbName: string = 'InsightLeadDB',
    version: number = 1,
    stores: { name: string; keyPath?: string; indexes?: { name: string; keyPath: string; unique?: boolean }[] }[] = []
  ) {
    this.dbName = dbName;
    this.version = version;
    this.stores = stores;
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores if they don't exist
        this.stores.forEach(storeConfig => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath || 'id'
            });

            // Create indexes if specified
            if (storeConfig.indexes) {
              storeConfig.indexes.forEach(index => {
                store.createIndex(index.name, index.keyPath, { unique: index.unique || false });
              });
            }
          }
        });
      };
    });
  }

  async put(storeName: string, data: any): Promise<void> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to put data: ${request.error?.message}`));
      
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        db.close();
        reject(new Error(`Transaction failed: ${transaction.error?.message}`));
      };
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(new Error(`Failed to get data: ${request.error?.message}`));
      
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        db.close();
        reject(new Error(`Transaction failed: ${transaction.error?.message}`));
      };
    });
  }

  async getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T | undefined> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.get(value);

      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(new Error(`Failed to get data by index: ${request.error?.message}`));
      
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        db.close();
        reject(new Error(`Transaction failed: ${transaction.error?.message}`));
      };
    });
  }

  async getAllByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(new Error(`Failed to get all data by index: ${request.error?.message}`));
      
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        db.close();
        reject(new Error(`Transaction failed: ${transaction.error?.message}`));
      };
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(new Error(`Failed to get all data: ${request.error?.message}`));
      
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        db.close();
        reject(new Error(`Transaction failed: ${transaction.error?.message}`));
      };
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete data: ${request.error?.message}`));
      
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        db.close();
        reject(new Error(`Transaction failed: ${transaction.error?.message}`));
      };
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear store: ${request.error?.message}`));
      
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        db.close();
        reject(new Error(`Transaction failed: ${transaction.error?.message}`));
      };
    });
  }
}

// Singleton instance with predefined stores
export const createDatabase = () => {
  return new IndexedDBHelper('InsightLeadDB', 1, [
    {
      name: 'peers',
      keyPath: 'id',
      indexes: [
        { name: 'githubUsername', keyPath: 'githubUsername', unique: true },
        { name: 'teamId', keyPath: 'teamId', unique: false },
        { name: 'email', keyPath: 'email', unique: true }
      ]
    },
    {
      name: 'teams',
      keyPath: 'id',
      indexes: [
        { name: 'leadId', keyPath: 'leadId', unique: false },
        { name: 'department', keyPath: 'department', unique: false },
        { name: 'name', keyPath: 'name', unique: true }
      ]
    },
    {
      name: 'objectives',
      keyPath: 'id',
      indexes: [
        { name: 'peerId', keyPath: 'peerId', unique: false },
        { name: 'category', keyPath: 'category', unique: false },
        { name: 'priority', keyPath: 'priority', unique: false }
      ]
    },
    {
      name: 'settings',
      keyPath: 'key'
    }
  ]);
};