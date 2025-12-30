import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';

/**
 * DTO para actualizar parcialmente un Customer.
 * Igual que CreateCustomerDto pero todos los campos son opcionales.
 */
export class UpdateCustomerDto 
{
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