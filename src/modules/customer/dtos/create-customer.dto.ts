export type UpdateCustomerDtoType = Partial<CreateCustomerDto>;

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