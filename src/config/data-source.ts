import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Customer } from '@/modules/customer/customer.entity';
import { Product } from '@/modules/product/product.entity';
import { Session } from '@/modules/session/session.entity';
import { Verification } from '@/modules/verification/verification.entity';
import { Payment } from '@/modules/payment/payment.entity';
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
    Product,
    Session,
    Payment,
    Verification],
  migrations: [],
  subscribers: [],
});