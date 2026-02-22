import {
  IsString,
  IsUUID,
  IsNotEmpty,
  MaxLength,
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
  @IsNotEmpty({ message: 'method es obligatorio' })
  @MaxLength(50, { message: 'method no debe superar 50 caracteres' })
  method!: string;
}