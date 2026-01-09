import {
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';

export type VerificationStatus = | 'pending' | 'approved' | 'rejected' | 'expired';

/**
 * DTO para actualizar parcialmente una Verification.
 * Igual que CreateVerificationDto pero todos los campos son opcionales.
 */
export class UpdateVerificationDto 
{
  @IsOptional()
  @IsUUID('4')
  customer_id?: string;

  @IsOptional()
  @IsUUID('4')
  session_id?: string;

  @IsOptional()
  @IsUUID('4')
  payment_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  type?: string;

  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'expired'])
  status?: VerificationStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  attempts?: number;
}