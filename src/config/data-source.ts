import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Customer } from '@/models/customer.model';
import { Service } from '@/models/service.model';
import { Session } from '@/models/session.model';
import { Verification } from '@/models/verification.model';
import { Payment } from '@/models/payment.model';
//import { ServicePriceRange } from './entities/ServicePriceRange';

export const AppDataSource = new DataSource(
{
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
    Payment,
    Verification],
  migrations: [],
  subscribers: [],
});