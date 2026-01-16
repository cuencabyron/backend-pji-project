import {
  IsString,
  IsUUID,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

/**
 * DTO para crear un nuevo Service.
 * Representa la forma del body en POST /api/services.
 */
export class CreateProductDto 
{
  @IsUUID('4', { message: 'customer_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'customer_id es obligatorio' })
  customer_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del servicio es obligatorio' })
  @MaxLength(100, { message: 'El nombre no debe superar 100 caracteres' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MaxLength(255, { message: 'La descripción no debe superar 255 caracteres' })
  description!: string;

  @IsString()
  @IsNotEmpty({ message: 'El mínimo mensual es obligatorio' })
  @MaxLength(10, { message: 'min_monthly_rent no debe superar 10 caracteres' })
  min_monthly_rent!: string;

  @IsString()
  @IsNotEmpty({ message: 'El máximo mensual es obligatorio' })
  @MaxLength(10, { message: 'max_monthly_rent no debe superar 10 caracteres' })
  max_monthly_rent!: string;

  @IsOptional()
  @IsBoolean({ message: 'active debe ser un booleano' })
  active?: boolean;
}