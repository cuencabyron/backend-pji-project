import { createPool } from 'mysql2/promise';

export const mysqlPool = createPool(
{
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'portal_pji_project',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  decimalNumbers: true,
});