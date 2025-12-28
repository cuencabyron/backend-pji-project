/**
 * DTO para crear un nuevo Service.
 * Representa la forma del body en POST /api/services.
 */
export interface CreateServiceDto 
{
  customer_id: string;   
  name: string;
  description: string;
  active?: boolean;
}


/**
 * DTO para actualizar parcialmente una service. 
 * Todos los campos son opcionales porque se usa en PUT/PATCH. 
 */
export interface UpdateServiceDto 
{
  customer_id?: string; 
  name?: string;
  description?: string;
  active?: boolean;
}

/**
 * DTO de respuesta. Sirve para controlar qué
 * campos expones al frontend.
 */
export interface ServiceResponseDto 
{
  service_id: string;
  customer_id: string;
  name: string;
  description: string;
  active: boolean;
}
