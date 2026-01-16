// Importa decoradores y tipos de TypeORM para definir una entidad y sus columnas.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

import { Customer } from '../customer/customer.entity';

import { Verification } from '../verification/verification.entity';
@Entity({ name: 'session' })
export class Session 
{
  // ============================================
  // CAMPOS PROPIOS
  // ============================================
  @PrimaryGeneratedColumn('uuid') session_id!: string;
  @Column({ type: 'varchar', length: 255 }) user_agent!: string;

  @Column({ length: 20, default: 'active' }) status!: string;

  @CreateDateColumn({ type: 'datetime' }) started_at!: Date;

  @Column({ type: 'datetime' }) ended_at!: Date;

  @CreateDateColumn({ type: 'datetime' }) created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;

  // ==============================================
  // IDS DERIVADOS DE LAS RELACIONES (SOLO LECTURA)
  // ==============================================
  @Column({type: 'char', length: 36}) customer_id!: string;

  // ============================================
  // RELACIONES (LADO N:1)
  // ============================================
  @ManyToOne(() => Customer, c => c.sessions)
  @JoinColumn({ name: 'customer_id' }) customer!: Customer;

  // ============================================
  // RELACIONES (LADO 1:N)
  // ============================================
  @OneToMany(() => Verification, v => v.session) verifications!: Verification[];
}