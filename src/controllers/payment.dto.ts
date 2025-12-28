/**
 * DTO para crear un nuevo Payment.
 * Representa la forma del body en POST /api/payments.
 */
export interface CreatePaymentDto 
{
  customer_id: string;
  amount: string;
  currency: string;
  method: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  external_ref: string;
}

/**
 * DTO para actualizar parcialmente un Payment. 
 * Todos los campos son opcionales porque se usa en PUT/PATCH. 
 */
export interface UpdatePaymentDto 
{
  customer_id?: string;
  amount?: string;
  currency?: string;
  method?: string;
  status?: 'pending' | 'paid' | 'failed' | 'refunded';
  external_ref?: string;
}

/**
 * DTO de respuesta. Sirve para controlar qué
 * campos expones al frontend.
 */
export interface PaymentResponseDto 
{
  payment_id: string;
  customer_id: string;
  amount: string;
  currency: string;
  method: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  external_ref: string;
  created_at: Date;
  updated_at: Date;
}
