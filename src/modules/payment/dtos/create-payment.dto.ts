import {
  IsString,
  IsUUID,
  IsNotEmpty,
  MaxLength,
  IsIn,
} from 'class-validator';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * DTO para crear un nuevo Payment.
 * Representa la forma del body en POST /api/payments.
 */
export class CreatePaymentDto 
{
  @IsUUID('4', { message: 'customer_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'customer_id es obligatorio' })
  customer_id!: string;

  @IsUUID('4', { message: 'product_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'product_id es obligatorio' })
  product_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'amount es obligatorio' })
  @MaxLength(10, { message: 'amount no debe superar 20 caracteres' })
  amount!: string;

  @IsString()
  @IsNotEmpty({ message: 'currency es obligatorio' })
  @MaxLength(10, { message: 'currency no debe superar 10 caracteres' })
  currency!: string;

  @IsString()
  @IsNotEmpty({ message: 'method es obligatorio' })
  @MaxLength(50, { message: 'method no debe superar 50 caracteres' })
  method!: string;

  @IsIn(['pending', 'paid', 'failed', 'refunded'], {
    message: 'status debe ser pending, paid, failed o refunded',
  })
  status!: PaymentStatus;

  @IsString()
  @IsNotEmpty({ message: 'external_ref es obligatorio' })
  @MaxLength(100, { message: 'external_ref no debe superar 100 caracteres' })
  external_ref!: string;
}