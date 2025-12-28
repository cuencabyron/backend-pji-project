/**
 * DTO para crear una nueva Session.
 * Representa la forma del body en POST /api/sessions.
 */
export interface CreateSessionDto 
{
  customer_id: string;
  user_agent: string;
  status?: 'active' | 'ended' | 'revoked';
}


/**
 * DTO para actualizar parcialmente una session. 
 * Todos los campos son opcionales porque se usa en PUT/PATCH. 
 */
export interface UpdateSessionDto 
{
  customer_id?: string;
  user_agent?: string;
  status?: 'active' | 'ended' | 'revoked';
}


/**
 * DTO de respuesta. Sirve para controlar qué
 * campos expones al frontend.
 */
export interface SessionResponseDto 
{
  session_id: string;
  customer_id: string;
  user_agent: string;
  status: 'active' | 'ended' | 'revoked';
  started_at: Date;
  ended_at: Date | null;   // si lo manejas nullable
  created_at: Date;
  updated_at: Date;
}
