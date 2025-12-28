/**
 * DTO para crear una nueva Verification.
 * Body de POST /api/verifications.
 */
export interface CreateVerificationDto 
{
  customer_id: string;
  session_id: string;
  payment_id: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  attempts: number;
}

/**
 * DTO para actualizar parcialmente una Verification.
 * Body de PUT /api/verifications/:id.
 */
export interface UpdateVerificationDto 
{
  customer_id?: string;
  session_id?: string;
  payment_id?: string;
  type?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'expired';
  attempts?: number;
}

/**
 * DTO de respuesta para Verification.
 */
export interface VerificationResponseDto 
{
  verification_id: string;
  customer_id: string;
  session_id: string;
  payment_id: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  attempts: number;
}
