import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

/**
 * DTO para crear un nuevo Customer.
 * Representa la forma del body en POST /api/customers.
 */
export class CreateCustomerDto 
{
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(200, { message: 'El nombre no debe superar 200 caracteres' })
  name!: string;

  email: string;
  phone: string;
  address: string;
  active?: boolean;
}

/**
 * DTO para actualizar parcialmente un Customer. 
 * Todos los campos son opcionales porque se usa en PUT/PATCH. 
 */
export interface UpdateCustomerDto 
{
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  active?: boolean;
}

/**
 * DTO de respuesta. Sirve para controlar qué
 * campos expones al frontend.
 */
export interface CustomerResponseDto 
{
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
}