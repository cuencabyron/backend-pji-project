import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Customer } from './entities/Customer';
import { Service } from './entities/Service';
import { Session } from './entities/Session';
import { Verification } from './entities/Verification';
import { Payment } from './entities/Payment';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: +(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASS ?? '',
  database: process.env.DB_NAME ?? 'portal_pji_project',
  synchronize: false, // útil en desarrollo. En producción usa migrations.
  logging: false,
  entities: [
    Customer,
    Service,
    Session,
    Verification,
    Payment,],
  migrations: [],
  subscribers: [],
});
