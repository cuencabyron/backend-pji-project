import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToMany } from 'typeorm';

import { Customer } from './customer.model';

import { Session } from './session.model';

import { Payment } from './payment.model';

@Entity({ name: 'verification' })
export class Verification 
{ 
  // ============================================
  // CAMPOS PROPIOS
  // ============================================
  @PrimaryGeneratedColumn('uuid')verification_id!: string;

  @Column({ length: 30 }) type!: string;

  @Column({ length: 20, default: 'pending' }) status!: string;

  @Column({ type: 'int', default: 0 }) attempts!: number;

  @Column({ type: 'datetime' }) expires_at!: Date;

  @Column({ type: 'datetime'}) verified_at!: Date;

  @CreateDateColumn({ type: 'datetime' }) created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;

  // ==============================================
  // IDS DERIVADOS DE LAS RELACIONES (SOLO LECTURA)
  // ==============================================
  @Column({type: 'char', length: 36}) customer_id!: string;

  @Column({type: 'char', length: 36}) session_id!: string;

  @Column({type: 'char', length: 36}) payment_id!: string;

  // ============================================
  // RELACIONES (LADO N:1)
  // ============================================
  @ManyToOne(() => Customer, c => c.verifications)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @ManyToOne(() => Session, s => s.verifications)
  @JoinColumn({ name: 'session_id' })
  session!: Session;

  @ManyToOne(() => Payment, p => p.verifications)
  @JoinColumn({ name: 'payment_id' })
  payment!: Payment;
}
