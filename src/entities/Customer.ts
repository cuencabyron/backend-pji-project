// Importa decoradores y tipos de TypeORM para definir una entidad y sus columnas.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany } from 'typeorm';7

import { Session } from './Session';

import { Payment } from './Payment';

import { Verification } from './Verification';

import { Service } from './Service';

// Declara una entidad de TypeORM y asigna explícitamente el nombre de la tabla = 'service'.
@Entity({ name: 'customer' })
export class Customer {
  // Clave primaria autogenerada en formato UUID.
  // En MySQL, TypeORM la mapea a CHAR(36) por defecto.
  @PrimaryGeneratedColumn('uuid') customer_id!: string;

  // Columna 'name' tipo VARCHAR(200) NOT NULL.
  // El '!' indica al compilador TS que el valor será definido por TypeORM en tiempo de ejecución.
  @Column({ type: 'varchar', length: 200 }) name!: string;

  // Columna 'email' tipo VARCHAR(254) NOT NULL.
  @Column({ type: 'varchar', length: 254 }) email!: string;

  // Columna 'phone' tipo VARCHAR(25) NOT NULL.
  @Column({ type: 'varchar', length: 25 }) phone!: string;

  // Columna 'address' tipo VARCHAR(255) NOT NULL.
  @Column({ type: 'varchar', length: 255 }) address!: string;

  // Columna booleana con default = true.
  // En MySQL se representa como TINYINT(1) (0/1) bajo el capó.
  @Column({ type: 'boolean', default: true }) active!: boolean;

  // Columna de fecha/hora de creación.
  // TypeORM la rellena automáticamente al insertar (NOW/CURRENT_TIMESTAMP en MySQL).
  @CreateDateColumn({ type: 'datetime' }) created_at!: Date;

  // Columna de fecha/hora de última actualización.
  // TypeORM la actualiza automáticamente en cada UPDATE/save.
  @UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;

  @OneToMany(() => Payment, p => p.customer) payments!: Payment[];
  @OneToMany(() => Session, s => s.customer) sessions!: Session[];
  @OneToMany(() => Verification, v => v.customer) verifications!: Verification[];
  @ManyToMany(() => Service, s => s.customer) services!: Service[];
}