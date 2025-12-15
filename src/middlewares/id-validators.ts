import { Request, Response, NextFunction } from 'express'

export function validateCustomerId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  // Extrae el parámetro `id` de la URL, por ejemplo:
  // GET /api/customers/583e2f58-e0b6-4fd2-adb1-c6b948fe32ad  → id = '583e2f58-e0b6-4fd2-adb1-c6b948fe32ad'
  const { id } = req.params;

  // Valida que exista y que tenga al menos 36 caracteres (tamaño típico de un UUID v4)
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

export function validateServiceId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  // Extrae el parámetro `id` de la URL, p.ej. GET /api/services/uuid
  const { id } = req.params;

  // Valida que exista y que tenga al menos 36 caracteres (tamaño típico de un UUID v4)
  if (!id || id.length < 36) 
  {
    // Si el `id` no pasa la validación, respondemos con 400 (Bad Request)
    // y NO llamamos a `next()`, por lo que el controlador principal nunca se ejecuta.
    return res.status(400).json(
    { 
      message: 'Parámetro id inválido' 
    });
  }

  next();
}

export function validateSessionId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  // Extrae el parámetro `id` de la URL, p.ej. GET /api/sessions/uuid
  const { id } = req.params;

  // Valida que exista y que tenga al menos 36 caracteres (tamaño típico de un UUID v4)
  if (!id || id.length < 36) 
  {
    return res.status(400).json(
    { 
      message: 'Parámetro id inválido' 
    });
  }

  // Si pasa la validación, continúa con el siguiente middleware/controlador
  next();
}

export function validatePaymentId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  // Extrae el parámetro `id` de la URL, p.ej. GET /api/payments/uuid
  const { id } = req.params;

  // Valida que exista y que tenga al menos 36 caracteres (tamaño típico de un UUID v4)
  if (!id || id.length < 36) 
  {
    return res.status(400).json(
    { 
      message: 'Parámetro id inválido' 
    });
  }

  next();
}

export function validateVerificationId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  // Extrae el parámetro `id` de la URL, p.ej. GET /api/vericationSs/uuid
  const { id } = req.params;

  // Valida que exista y que tenga al menos 36 caracteres (tamaño típico de un UUID v4)
  if (!id || id.length < 36) 
  {
    return res.status(400).json(
    { 
      message: 'Parámetro id inválido' 
    });
  }

  next();
}