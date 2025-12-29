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
  @MaxLength(100, { message: 'El nombre no debe superar 100 caracteres' })
  name!: string;

  @IsEmail({}, { message: 'El formato de email es inválido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @MaxLength(10, { message: 'El email no debe superar 100 caracteres' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @MaxLength(20, { message: 'El teléfono no debe superar 20 caracteres' })
  phone!: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @MaxLength(100, { message: 'La dirección no debe superar 100 caracteres' })
  address!: string;

  @IsOptional()
  @IsBoolean({ message: 'active debe ser un booleano' })
  active?: boolean;
}

/**
 * DTO para actualizar parcialmente un Customer.
 * Igual que CreateCustomerDto pero todos los campos son opcionales.
 */
export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  address?: string;

  @IsOptional()
  @IsBoolean()
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