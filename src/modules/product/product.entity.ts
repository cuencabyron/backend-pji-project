import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Payment } from '@/modules/payment/payment.entity'

@Entity({ name: 'product' })
export class Product
{
  // ============================================
  // CAMPOS PROPIOS
  // ============================================
  @PrimaryGeneratedColumn('uuid') product_id!: string;

  @Column({ type: 'varchar', length: 150 }) name!: string;

  @Column({ type: 'varchar', length: 255 }) description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 }) min_monthly_rent!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 }) max_monthly_rent!: number;

  @Column({ type: 'boolean', default: true }) active!: boolean;

  @CreateDateColumn({ type: 'datetime' }) created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;

  // ============================================
  // RELACIONES (LADO 1:N)
  // ============================================
  @OneToMany(() => Payment, p => p.product) payments!: Payment[];
}