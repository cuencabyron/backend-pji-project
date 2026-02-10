import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany} from 'typeorm';7
import { Session } from '@/modules/session/session.entity';
import { Payment } from '@/modules/payment/payment.entity';
import { Verification } from '@/modules/verification/verification.entity';

@Entity({ name: 'customer' })
export class Customer
{
  // ============================================
  // CAMPOS PROPIOS
  // ============================================
  @PrimaryGeneratedColumn('uuid') customer_id!: string;

  @Column({ type: 'varchar', length: 100 }) name!: string;

  @Column({ type: 'varchar', length: 100 }) email!: string;

  @Column({ type: 'varchar', length: 25 }) phone!: string;

  @Column({ type: 'varchar', length: 100 }) address!: string;

  @Column({ type: 'boolean', default: true }) active!: boolean;

  @CreateDateColumn({ type: 'datetime' }) created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;

  // ============================================
  // RELACIONES (LADO 1:N)
  // ============================================
  @OneToMany(() => Session, s => s.customer) sessions!: Session[];
  @OneToMany(() => Payment, p => p.customer) payments!: Payment[];
  @OneToMany(() => Verification, v => v.customer) verifications!: Verification[];
}