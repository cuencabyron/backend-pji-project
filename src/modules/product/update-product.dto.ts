import {
  IsString,
  IsUUID,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';

/**
 * DTO para actualizar parcialmente un Product.
 * Igual que CreateProductDto pero todos los campos son opcionales.
 */
export class UpdateProductDto 
{
  @IsOptional()
  @IsUUID('4', { message: 'customer_id debe ser un UUID válido' })
  customer_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}