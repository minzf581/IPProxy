import { Pool } from 'mysql2/promise';

const dbConfig = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ipproxy_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  production: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    ssl: {
      rejectUnauthorized: false
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const pool = new Pool(dbConfig[env]);

export default pool;
