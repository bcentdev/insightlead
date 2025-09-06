import { IndexedDBClient, IndexedDBConfig } from './indexeddb-client';

export const DB_NAME = 'InsightLeadDB';
export const DB_VERSION = 1;

export const dbConfig: IndexedDBConfig = {
  dbName: DB_NAME,
  version: DB_VERSION,
  stores: [
    {
      name: 'settings',
      keyPath: 'key'
    },
    {
      name: 'peers',
      keyPath: 'id',
      indexes: [
        { name: 'teamId', keyPath: 'teamId' },
        { name: 'githubUsername', keyPath: 'githubUsername', unique: true },
        { name: 'email', keyPath: 'email', unique: true }
      ]
    },
    {
      name: 'teams',
      keyPath: 'id'
    },
    {
      name: 'objectives',
      keyPath: 'id',
      indexes: [
        { name: 'peerId', keyPath: 'peerId' },
        { name: 'teamId', keyPath: 'teamId' },
        { name: 'status', keyPath: 'status' }
      ]
    },
    {
      name: 'metrics',
      keyPath: 'id',
      indexes: [
        { name: 'peerId', keyPath: 'peerId' },
        { name: 'source', keyPath: 'source' },
        { name: 'type', keyPath: 'type' },
        { name: 'timestamp', keyPath: 'timestamp' }
      ]
    }
  ]
};

let dbInstance: IndexedDBClient | null = null;

export async function getDatabase(): Promise<IndexedDBClient> {
  if (!dbInstance) {
    dbInstance = new IndexedDBClient(dbConfig);
    await dbInstance.init();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}