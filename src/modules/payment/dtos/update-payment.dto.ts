import {
  IsString,
  IsUUID,
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
  @IsUUID('4')
  customer_id?: string;

  @IsOptional()
  @IsUUID('4')
  product_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  amount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  method?: string;

  @IsOptional()
  @IsIn(['pending', 'paid', 'failed', 'refunded'])
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  external_ref?: string;
}