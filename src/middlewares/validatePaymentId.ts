// src/middlewares/validatePaymentId.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de validación para el parámetro `id` en rutas de Payment.
 *
 * Verifica que el `id` tenga un formato mínimo válido antes de llegar al controlador.
 * Si es inválido, responde con 400 (Bad Request).
 *
 * Uso típico:
 *   router.get('/:id', validatePaymentId, getPayment);
 *   router.put('/:id', validatePaymentId, updatePayment);
 *   router.delete('/:id', validatePaymentId, deletePayment);
 */
export function validatePaymentId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  const { id } = req.params;

  if (!id || id.length < 36) {
    return res.status(400).json({ message: 'Parámetro id inválido' });
  }

  next();
}