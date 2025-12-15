// src/middlewares/validateSessionId.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de validación para el parámetro `id` en rutas de Session.
 *
 * Se asegura de que el `id` tenga una forma mínima válida (por ejemplo, UUID de 36 caracteres).
 * Si el valor no es válido, responde con 400 y no deja continuar al controlador.
 *
 * Uso típico:
 *   router.get('/:id', validateSessionId, getSession);
 *   router.put('/:id', validateSessionId, updateSession);
 *   router.delete('/:id', validateSessionId, deleteSession);
 */
export function validateSessionId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  // Extrae el parámetro de ruta `id`, p.ej. GET /api/sessions/uuid
  const { id } = req.params;

  // Valida que exista y que tenga al menos 36 caracteres (tamaño típico de un UUID v4)
  if (!id || id.length < 36) {
    return res.status(400).json({ message: 'Parámetro id inválido' });
  }

  // Si pasa la validación, continúa con el siguiente middleware/controlador
  next();
}