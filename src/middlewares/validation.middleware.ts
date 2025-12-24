import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware genérico para manejar los errores de validación generados por express-validator.
 *
 * Este middleware debe colocarse DESPUÉS de los "validators" de express-validator
 * (por ejemplo, `param('id').isUUID()`, `body('email').isEmail()`, etc.)
 * y ANTES del controlador final.
 *
 * Flujo de trabajo:
 *  1. Los validadores de express-validator se ejecutan y almacenan posibles errores
 *     de validación en el objeto `req`.
 *  2. Este middleware invoca `validationResult(req)` para recuperar esos errores.
 *  3. Si hay errores:
 *       - Responde con HTTP 400 (Bad Request).
 *       - Devuelve un JSON con un mensaje genérico y el listado detallado de errores.
 *     Si NO hay errores:
 *       - Llama a `next()` para continuar con el siguiente middleware/controlador.
 *
 * Ejemplo de uso en una ruta:
 *
 *   router.post(
 *     '/customers',
 *     body('email').isEmail(),
 *     handleValidationErrors,
 *     createCustomerController
 *   );
 *
 * @param req Objeto de la solicitud HTTP, donde express-validator guarda los errores.
 * @param res Objeto de la respuesta HTTP, utilizado para enviar el error en caso de validación fallida.
 * @param next Función de Express para pasar el control al siguiente middleware/controlador.
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) 
{
  // Obtiene la colección de errores de validación que express-validator
  // ha ido acumulando sobre este `req` a partir de los validadores ejecutados.
  const errors = validationResult(req);

  // Si el resultado NO está vacío, significa que hubo uno o más errores de validación.
  if (!errors.isEmpty()) 
  {
    // Responde con estado 400 (Bad Request) y un cuerpo JSON que incluye:
    // - un mensaje genérico
    // - el array de errores detallado (campo, mensaje, ubicación, etc.)
    return res.status(400).json({
      message: 'Datos de entrada inválidos',
      errors: errors.array(), // aquí vienen los detalles de qué campo falló y por qué
    });
  }

  // Si no hay errores de validación, se continúa con la cadena de middlewares
  // y eventualmente con el controlador de la ruta.
  next();
}