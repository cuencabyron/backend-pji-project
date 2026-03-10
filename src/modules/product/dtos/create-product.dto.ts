import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsNumberString,
} from 'class-validator';

/**
 * DTO para crear un nuevo Product.
 * Representa el body de POST /api/products
 */
export class CreateProductDto 
{
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no debe superar 100 caracteres' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MaxLength(255, { message: 'La descripción no debe superar 255 caracteres' })
  description!: string;

  @IsNumberString()
  @IsNotEmpty({ message: 'min_monthly_rent es obligatorio' })
  min_monthly_rent!: string;

  @IsNumberString()
  @IsNotEmpty({ message: 'max_monthly_rent es obligatorio' })
  max_monthly_rent!: string;

  @IsOptional()
  @IsBoolean({ message: 'active debe ser booleano' })
  active?: boolean;
}