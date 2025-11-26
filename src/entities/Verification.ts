import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToMany } from 'typeorm';

import { Customer } from './Customer';

import { Session } from './Session';

@Entity({ name: 'verification' })
export class Verification {
  @PrimaryGeneratedColumn('uuid')verification_id!: string;

  
  @Column('uuid') customer_id!: string;


  @Column('uuid') session_id!: string;

  @OneToMany(() => Customer, c => c.verifications)
  @JoinColumn({ name: 'customer_id' }) customer!: Customer;

  @ManyToOne(() => Session, s => s.session_id)
  @JoinColumn({ name: 'session_id' }) session!: Session | null;

  @Column({ length: 30 }) type!: string;
  @Column({ length: 20, default: 'pending' }) status!: string;


  @Column({ type: 'int', default: 0 }) attempts!: number;


  @Column({ type: 'datetime' }) expires_at!: Date;


  @Column({ type: 'datetime', nullable: true }) verified_at!: Date | null;


  @CreateDateColumn({ type: 'datetime' }) created_at!: Date;


  @UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;
}
