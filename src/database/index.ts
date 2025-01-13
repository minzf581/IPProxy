import Dexie from 'dexie';

class IPProxyDatabase extends Dexie {
  users: Dexie.Table<any, number>;
  agents: Dexie.Table<any, number>;
  orders: Dexie.Table<any, number>;
  resources: Dexie.Table<any, number>;
  settings: Dexie.Table<any, number>;
  transactions: Dexie.Table<any, number>;

  constructor() {
    super('IPProxyDatabase');
    
    this.version(1).stores({
      users: '++id, username, email, status, createdAt, updatedAt',
      agents: '++id, name, status, createdAt, updatedAt',
      orders: '++id, userId, agentId, type, status, createdAt, updatedAt',
      resources: '++id, type, status, createdAt, updatedAt',
      settings: '++id, key, value',
      transactions: '++id, userId, type, amount, createdAt'
    });
  }
}

const db = new IPProxyDatabase();

export default db;
