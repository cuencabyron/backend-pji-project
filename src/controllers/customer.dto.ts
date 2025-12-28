/**
 * DTO para crear un nuevo Customer.
 * Representa la forma del body en POST /api/customers.
 */
export interface CreateCustomerDto 
{
  name: string;
  email: string;
  phone: string;
  address: string;
  active?: boolean;
}

/**
 * DTO para actualizar parcialmente un Customer. 
 * Todos los campos son opcionales porque se usa en PUT/PATCH. 
 */
export interface UpdateCustomerDto 
{
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  active?: boolean;
}

/**
 * DTO de respuesta. Sirve para controlar qué
 * campos expones al frontend.
 */
export interface CustomerResponseDto 
{
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
}