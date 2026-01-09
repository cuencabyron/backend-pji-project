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

  @IsOptional()
  @IsBoolean({ message: 'active debe ser un booleano' })
  active?: boolean;
}