import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, ManyToOne } from 'typeorm';
import { Customer } from '../customer/customer.entity'
//import { ServicePriceRange } from './ServicePriceRange';

@Entity({ name: 'product' })
export class Product
{
  // ============================================
  // CAMPOS PROPIOS
  // ============================================
  @PrimaryGeneratedColumn('uuid') product_id!: string;

  @Column({ type: 'varchar', length: 150 }) name!: string;

  @Column({ type: 'varchar', length: 255 }) description!: string;

  @Column({ type: 'boolean', default: true }) active!: boolean;

  @CreateDateColumn({ type: 'datetime' }) created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;

  // ==============================================
  // IDS DERIVADOS DE LAS RELACIONES (SOLO LECTURA)
  // ==============================================
  @Column({type: 'char', length: 36}) customer_id!: string;

  // ============================================
  // RELACIONES (LADO N:1)
  // ============================================
  @ManyToOne(() => Customer, c => c.products)
  @JoinColumn({ name: 'customer_id' }) customer!: Customer;

  // ============================================
  // RELACIONES (LADO 1:N)
  // ============================================
  //@OneToMany(() => ServicePriceRange, r => r.service) priceRanges!: ServicePriceRange[];
}