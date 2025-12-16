import { param } from 'express-validator';

/**
 * Crea un validador para el parámetro `id` que exige formato UUID v4.
 * Se puede reutilizar para customers, sessions, payments, etc.
 */
export function uuidIdParamValidator(entityName: string) 
{
  return param('id')
    .isUUID()
    .withMessage(`El parámetro id de ${entityName} debe ser un UUID válido`);
}
