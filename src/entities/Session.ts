// Importa decoradores y tipos de TypeORM para definir una entidad y sus columnas.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, JoinColumn } from 'typeorm';

import { Customer } from './Customer';

// Declara una entidad de TypeORM y asigna explícitamente el nombre de la tabla = 'session'.
@Entity({ name: 'session' })
export class Session {
  // Clave primaria autogenerada en formato UUID.
  // En MySQL, TypeORM la mapea a CHAR(36) por defecto.
  @PrimaryGeneratedColumn('uuid') session_id!: string;


  @Column({ type: 'uuid' }) customer_id!: string;


  @OneToMany(() => Customer, c => c.sessions)
  @JoinColumn({ name: 'customer_id' }) customer!: Customer;

  // Columna 'user_agent' tipo VARCHAR(255) NOT NULL.
  // El '!' indica al compilador TS que el valor será definido por TypeORM en tiempo de ejecución.
  @Column({ type: 'varchar', length: 255 }) user_agent!: string;

  // Columna 'status' tipo VARCHAR(20) NOT NULL.
  @Column({ type: 'varchar', length: 20 }) status!: string;

   // Columna de fecha/hora de inicio de sesión.
  // TypeORM la rellena automáticamente al insertar (NOW/CURRENT_TIMESTAMP en MySQL).
  @CreateDateColumn({ type: 'datetime' }) started_at!: Date;

   // Columna de fecha/hora de fin de la sesión.
  // TypeORM la rellena automáticamente al insertar (NOW/CURRENT_TIMESTAMP en MySQL).
  @Column({ type: 'datetime' }) ended_at!: Date;

  // Columna de fecha/hora de creación.
  // TypeORM la rellena automáticamente al insertar (NOW/CURRENT_TIMESTAMP en MySQL).
  @CreateDateColumn({ type: 'datetime' }) created_at!: Date;

  // Columna de fecha/hora de última actualización.
  // TypeORM la actualiza automáticamente en cada UPDATE/save.
  @UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;
}