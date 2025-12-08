/*
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { Service } from './Service'

@Entity({ name: 'servicepricerange' })
export class ServicePriceRange {
  @PrimaryGeneratedColumn('uuid') range_id!: string;


  @Column('uuid') service_id!: string;

  @ManyToMany(() => Service, s => s.priceRanges)
  @JoinColumn({ name: 'service_id' }) service!: Service;

  @Column({ type: 'varchar', length: 10 }) min_montly_rent!: string;

  @Column({ type: 'varchar', length: 10 }) max_montly_rent!: string;

  @Column({ type: 'varchar', length: 10 }) anual_price!: string;

  @CreateDateColumn({ type: 'datetime' }) created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;
}
*/