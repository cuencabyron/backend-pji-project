import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToMany, ManyToOne } from 'typeorm';

import { Customer } from './customer.model';
import { Verification } from './verification.model';

@Entity({ name: 'payment' })
export class Payment 
{
  // ============================================
  // CAMPOS PROPIOS
  // ============================================
  @PrimaryGeneratedColumn('uuid') payment_id!: string;
  
  @Column({type: 'varchar', length: 20}) amount!: string;

  @Column({ type: 'char', length: 3, default: 'MXN' }) currency!: string;

  @Column({ length: 30 }) method!: string;

  @Column({ length: 20, default: 'pending' }) status!: string;

  @Column({ type: 'varchar', length: 100 }) external_ref!: string;

  @Column({ type: 'datetime', nullable: true }) paid_at!: Date | null;

  @CreateDateColumn({ type: 'datetime' }) created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;
  
  // ==============================================
  // IDS DERIVADOS DE LAS RELACIONES (SOLO LECTURA)
  // ==============================================
  @Column({type: 'char', length: 36}) customer_id!: string;

  // ============================================
  // RELACIONES (LADO N:1)
  // ============================================
  @ManyToOne(() => Customer, c => c.payments)
  @JoinColumn({ name: 'customer_id' }) customer!: Customer;

  // ============================================
  // RELACIONES (LADO 1:N)
  // ============================================
  @OneToMany(() => Verification, v => v.payment) verifications!: Verification[];
}
