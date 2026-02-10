import {
  IsString,
  IsUUID,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

/**
 * DTO para actualizar parcialmente un Product.
 * Igual que CreateProductDto pero todos los campos son opcionales.
 */
export class UpdateProductDto 
{
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  min_monthly_rent!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  max_monthly_rent!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}