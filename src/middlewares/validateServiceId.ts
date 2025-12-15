// src/middlewares/validateServiceId.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de validación para el parámetro `id` en rutas de Service.
 *
 * Comprueba que el `id` no esté vacío y tenga una longitud mínima,
 * evitando que el controlador trabaje con IDs claramente inválidos.
 *
 * Uso típico:
 *   router.get('/:id', validateServiceId, getService);
 *   router.put('/:id', validateServiceId, updateService);
 *   router.delete('/:id', validateServiceId, deleteService);
 */
export function validateServiceId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  const { id } = req.params;

  if (!id || id.length < 36) {
    return res.status(400).json({ message: 'Parámetro id inválido' });
  }

  next();
}