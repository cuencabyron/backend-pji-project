import { Request, Response, NextFunction } from 'express';
/**
 * Middleware de validación para el parámetro `id` de la ruta de Customer.
 *
 * Propósito:
 * - Asegurarse de que el `id` recibido en `req.params` tenga un formato mínimamente válido
 *   antes de llegar al controlador (handler) principal.
 * - Si el `id` es inválido, corta la ejecución de la cadena de middlewares y responde
 *   con un error 400 (Bad Request).
 *
 * Uso típico en rutas:
 *   router.get('/api/customers/:id', validateCustomerId, getCustomer);
 *   router.put('/api/customers/:id', validateCustomerId, updateCustomer);
 *   router.delete('/api/customers/:id', validateCustomerId, deleteCustomer);
 *
 * @param req  Objeto de petición HTTP de Express. Se tipa `Request<{ id: string }>`
 *             para indicar que en los parámetros de ruta esperamos una propiedad `id`.
 * @param res  Objeto de respuesta HTTP de Express, usado para devolver el error 400 si aplica.
 * @param next Función de Express que transfiere el control al siguiente middleware/handler
 *             si la validación es correcta.
 */
export function validateCustomerId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  // Extrae el parámetro `id` de la URL, por ejemplo:
  // GET /api/customers/583e2f58-e0b6-4fd2-adb1-c6b948fe32ad  → id = '583e2f58-e0b6-4fd2-adb1-c6b948fe32ad'
  const { id } = req.params;

  // Valida que:
  // - `id` exista (no sea undefined, null o cadena vacía)
  // - tenga una longitud mínima (36 caracteres es típico para UUID v4)
  if (!id || id.length < 36) 
  {
    // Si el `id` no pasa la validación, respondemos con 400 (Bad Request)
    // y NO llamamos a `next()`, por lo que el controlador principal nunca se ejecuta.
    return res.status(400).json(
        { 
            message: 'Parámetro id inválido' 
        });
  }

  // Si la validación es correcta, delega la ejecución al siguiente middleware/controlador.
  // En este punto, el handler (`getCustomer`, `updateCustomer`, etc.) ya puede asumir
  // que `req.params.id` tiene al menos una forma razonable.
  next();
}