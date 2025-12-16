import { Request, Response, NextFunction } from 'express';

/**
 * Opciones de configuración para el validador genérico de IDs.
 *
 * - entityName: nombre lógico de la entidad sobre la que se valida el ID.
 *               Solo se usa para construir mensajes de error más claros.
 *               Ejemplos: 'customer', 'session', 'payment', etc.
 *
 * - paramName:  nombre del parámetro de ruta que se quiere validar.
 *               Por defecto es 'id', pero permite otros nombres como
 *               'customerId', 'sessionId', etc. si algún día los necesitas.
 */
type IdValidatorOptions = 
{
  entityName?: string;   // Nombre de la entidad solo para el mensaje, ej. 'customer', 'session', etc.
  paramName?: string;    // Nombre del parámetro de ruta; por defecto 'id'
};

/**
 * Crea un middleware de Express que valida un parámetro de ruta
 * (por defecto `id`) con un formato tipo UUID.
 *
 * En esta implementación se hace una validación sencilla:
 * - Se comprueba que el valor exista.
 * - Se comprueba que su longitud sea al menos 36 caracteres (tamaño típico de un UUID v4).
 *
 * Si la validación falla:
 *  - Se responde con HTTP 400 (Bad Request) y un mensaje descriptivo.
 *
 * Si la validación es correcta:
 *  - Se llama a `next()` para que continúe la cadena de middlewares/controlador.
 *
 * @param options Opciones para personalizar el nombre de la entidad y del parámetro.
 * @returns Middleware de Express listo para usarse en las rutas.
 */
export function createIdValidator(options: IdValidatorOptions = {}) 
{
  // Extrae las opciones con valores por defecto:
  // - entityName: se usa solo para el mensaje de error (por defecto 'recurso').
  // - paramName: nombre del parámetro de ruta que se va a validar (por defecto 'id').
  const { entityName = 'recurso', paramName = 'id' } = options;

  // Devuelve el middleware real que usará Express.
  return (req: Request, res: Response, next: NextFunction) => 
  {
    // Obtiene el valor del parámetro desde req.params usando el nombre indicado.
    // Se usa "keyof typeof req.params" para que TypeScript no se queje por el índice dinámico.
    const value = req.params[paramName as keyof typeof req.params] as string | undefined;

    // Validación básica:
    // - debe existir (no null / undefined / string vacío)
    // - debe tener al menos 36 caracteres (longitud típica de un UUID v4)
    if (!value || value.length < 36) 
    {
      // Si el valor no es válido, se responde con 400 y se detiene la cadena.
      return res.status(400).json({
        message: `Parámetro ${paramName} de ${entityName} inválido`,
      });
    }

    // Si pasa la validación, se continúa con el siguiente middleware/controlador.
    next();
  };
}

/**
 * A partir de la función genérica `createIdValidator`, se crean
 * middlewares específicos por entidad. Todos comparten la misma
 * lógica de validación, pero cambian el nombre de la entidad en el mensaje.
 *
 * De esta forma se evita duplicar código y se mantiene un punto único
 * de mantenimiento para la validación de IDs.
 */

// Middleware para validar el parámetro `id` en rutas de Customer.
export const validateCustomerId     = createIdValidator({ entityName: 'customer' });

// Middleware para validar el parámetro `id` en rutas de Session.
export const validateSessionId      = createIdValidator({ entityName: 'session' });

// Middleware para validar el parámetro `id` en rutas de Payment.
export const validatePaymentId      = createIdValidator({ entityName: 'payment' });

// Middleware para validar el parámetro `id` en rutas de Service.
export const validateServiceId      = createIdValidator({ entityName: 'service' });

// Middleware para validar el parámetro `id` en rutas de Verification.
export const validateVerificationId = createIdValidator({ entityName: 'verification' });