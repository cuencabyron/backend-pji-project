import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToMany } from 'typeorm';

import { Customer } from './Customer';

@Entity({ name: 'payment' })
export class Payment {
  @PrimaryGeneratedColumn('uuid') payment_id!: string;


  @Column('uuid') customer_id!: string;


  @OneToMany(() => Customer, c => c.payments)
  @JoinColumn({ name: 'customer_id' }) customer!: Customer;


  @Column('decimal', { precision: 12, scale: 2 }) amount!: string;


  @Column({ type: 'char', length: 3, default: 'MXN' }) currency!: string;


  @Column({ length: 30 }) method!: string;


  @Column({ length: 20, default: 'pending' }) status!: string;


  @Column({ type: 'varchar', length: 100 }) external_ref!: string;


  @Column({ type: 'datetime', nullable: true }) paid_at!: Date | null;


  @CreateDateColumn({ type: 'datetime' }) created_at!: Date;


  @UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;
}
