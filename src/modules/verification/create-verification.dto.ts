export type UpdateVerificationDtoType = Partial<CreateVerificationDto>;

import {
  IsString,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';

export type VerificationStatus = | 'pending' | 'approved' | 'rejected' | 'expired';

/**
 * DTO para crear una nueva Verification.
 * Body de POST /api/verifications.
 */
export class CreateVerificationDto 
{
  @IsUUID('4', { message: 'customer_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'customer_id es obligatorio' })
  customer_id!: string;

  @IsUUID('4', { message: 'session_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'session_id es obligatorio' })
  session_id!: string;

  @IsUUID('4', { message: 'payment_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'payment_id es obligatorio' })
  payment_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'type es obligatorio' })
  @MaxLength(30, { message: 'type no debe superar 30 caracteres' })
  type!: string;

  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'expired'], {
    message: 'status debe ser pending, approved, rejected o expired',
  })
  status?: VerificationStatus;

  @IsInt({ message: 'attempts debe ser un número entero' })
  @Min(0, { message: 'attempts no puede ser negativo' })
  attempts!: number;
}