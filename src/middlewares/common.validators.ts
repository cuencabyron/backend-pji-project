import { param } from 'express-validator';

/**
 * Crea un validador para el parámetro de ruta `id` que exige formato UUID v4.
 *
 * Esta función devuelve una "regla de validación" de express-validator
 * que se puede usar en cualquier ruta que tenga `/:id` y donde se espere
 * que dicho `id` sea un UUID válido.
 *
 * El parámetro `entityName` se utiliza únicamente para construir un mensaje
 * de error más descriptivo, por ejemplo:
 *  - 'customer'
 *  - 'session'
 *  - 'payment'
 *
 * Ejemplo de uso en una ruta:
 *
 *   router.get(
 *     '/:id',
 *     uuidIdParamValidator('customer'),
 *     handleValidationErrors,
 *     getCustomer
 *   );
 *
 * En ese caso, si el `id` no es un UUID válido, se generará un error
 * de validación con el mensaje:
 *   "El parámetro id de customer debe ser un UUID válido"
 *
 * @param entityName Nombre de la entidad que se está validando (solo para el mensaje de error).
 * @returns Regla de validación para el parámetro `id` basada en express-validator.
 */
export function uuidIdParamValidator(entityName: string) 
{
  // `param('id')` crea una regla de validación sobre el parámetro de ruta llamado `id`.
  // Ejemplo de ruta: GET /api/customers/:id → aquí `id` es el segmento dinámico.
  return param('id')
    // `isUUID()` valida que el valor tenga el formato de un UUID v4 válido.
    .isUUID()
    // `withMessage(...)` define el mensaje de error que se usará si la validación falla.
}