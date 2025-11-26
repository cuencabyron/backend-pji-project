// Importa decoradores y tipos de TypeORM para definir una entidad y sus columnas.
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { Customer } from './Customer'

// Declara una entidad de TypeORM y asigna explícitamente el nombre de la tabla = 'service'.
@Entity({ name: 'service' })
export class Service {
  // Clave primaria autogenerada en formato UUID.
  // En MySQL, TypeORM la mapea a VARCHAR(36) por defecto.
  @PrimaryGeneratedColumn('uuid') service_id!: string;


  @Column('uuid') customer_id!: string;


  @ManyToMany(() => Customer, s => s.services)
  @JoinColumn({ name: 'customer_id' }) customer!: Customer;

  // Columna 'name' tipo VARCHAR(150) NOT NULL.
  // El '!' indica al compilador TS que el valor será definido por TypeORM en tiempo de ejecución.
  @Column({ type: 'varchar', length: 150 }) name!: string;

  // Columna 'description' tipo VARCHAR(255) NOT NULL.
  @Column({ type: 'varchar', length: 255 }) description!: string;

  // Columna booleana con default = true.
  // En MySQL se representa como TINYINT(1) (0/1) bajo el capó.
  @Column({ type: 'boolean', default: true }) active!: boolean;

  // Columna de fecha/hora de creación.
  // TypeORM la rellena automáticamente al insertar (NOW/CURRENT_TIMESTAMP en MySQL).
  @CreateDateColumn({ type: 'datetime' }) created_at!: Date;

  // Columna de fecha/hora de última actualización.
  // TypeORM la actualiza automáticamente en cada UPDATE/save.
  @UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;
}