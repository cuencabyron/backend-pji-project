// src/middlewares/validateVerificationId.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de validación para el parámetro `id` en rutas de Verification.
 *
 * Se encarga de validar la forma del `id` (por ejemplo, UUID) antes de que
 * el controlador intente buscar en base de datos.
 *
 * Uso típico:
 *   router.get('/:id', validateVerificationId, getVerification);
 *   router.put('/:id', validateVerificationId, updateVerification);
 *   router.delete('/:id', validateVerificationId, deleteVerification);
 */
export function validateVerificationId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  const { id } = req.params;

  if (!id || id.length < 36) {
    return res.status(400).json({ message: 'Parámetro id inválido' });
  }

  next();
}