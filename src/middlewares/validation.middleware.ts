import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware genérico para revisar los resultados de express-validator.
 * Si hay errores de validación, responde con 400 y el detalle;
 * si no, pasa al siguiente middleware/controlador.
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) 
{
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Datos de entrada inválidos',
      errors: errors.array(), // aquí vienen los detalles de qué campo falló
    });
  }

  next();
}
