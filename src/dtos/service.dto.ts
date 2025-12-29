// src/dtos/service.dto.ts
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
export class CreateServiceDto {
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

/**
 * DTO para actualizar parcialmente un Service.
 * Todos los campos son opcionales.
 */
export class UpdateServiceDto {
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

/**
 * DTO de respuesta para Service.
 * Controla qué campos expones al frontend.
 */
export interface ServiceResponseDto {
  service_id: string;
  customer_id: string;
  name: string;
  description: string;
  active: boolean;
}
