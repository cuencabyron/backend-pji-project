import {
  IsString,
  IsOptional,
  MaxLength,
  IsIn,
} from 'class-validator';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * DTO para actualizar parcialmente un Payment.
 * Igual que CreatePaymentDto pero todos los campos son opcionales.
 */
export class UpdatePaymentDto 
{
  @IsOptional()
  @IsString()
  @MaxLength(50)
  method?: string;

  @IsOptional()
  @IsIn(['pending', 'paid', 'failed', 'refunded'])
  status?: PaymentStatus;
}