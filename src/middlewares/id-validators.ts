import { Request, Response, NextFunction } from 'express'

/**
 * Middleware de validación para el parámetro `id` de la ruta de Customer.
 *
 * Propósito:
 * - Asegurarse de que el `id` recibido en `req.params` tenga un formato mínimamente válido
 *   antes de llegar al controlador (handler) principal.
 * - Si el `id` es inválido, corta la ejecución de la cadena de middlewares y responde
 *   con un error 400 (Bad Request).
 *
 * Uso típico en rutas:
 *   router.get('/api/customers/:id', validateCustomerId, getCustomer);
 *   router.put('/api/customers/:id', validateCustomerId, updateCustomer);
 *   router.delete('/api/customers/:id', validateCustomerId, deleteCustomer);
 *
 * @param req  Objeto de petición HTTP de Express. Se tipa `Request<{ id: string }>`
 *             para indicar que en los parámetros de ruta esperamos una propiedad `id`.
 * @param res  Objeto de respuesta HTTP de Express, usado para devolver el error 400 si aplica.
 * @param next Función de Express que transfiere el control al siguiente middleware/handler
 *             si la validación es correcta.
 */
export function validateCustomerId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  /* Extrae el parámetro `id` de la URL, por ejemplo:
  GET /api/customers/583e2f58-e0b6-4fd2-adb1-c6b948fe32ad  → id = '583e2f58-e0b6-4fd2-adb1-c6b948fe32ad'*/
  const { id } = req.params;

  // Valida que exista y que tenga al menos 36 caracteres (tamaño típico de un UUID v4)
  if (!id || id.length < 36) 
  {
    /* Si el `id` no pasa la validación, respondemos con 400 (Bad Request)
    y NO llamamos a `next()`, por lo que el controlador principal nunca se ejecuta.*/
    return res.status(400).json(
    { 
      message: 'Parámetro id inválido' 
    });
  }

  /*Si la validación es correcta, delega la ejecución al siguiente middleware/controlador.
  En este punto, el handler (`getCustomer`, `updateCustomer`, deleteCustomer.) ya puede asumir
  que `req.params.id` tiene al menos una forma razonable. */
  next();
}


/**
 * Middleware de validación para el parámetro `id` de la ruta de Service.
 *
 * Propósito:
 * - Asegurarse de que el `id` recibido en `req.params` tenga un formato mínimamente válido
 *   antes de llegar al controlador (handler) principal.
 * - Si el `id` es inválido, corta la ejecución de la cadena de middlewares y responde
 *   con un error 400 (Bad Request).
 *
 * Uso típico en rutas:
 *   router.get('/api/services/:id', validateServiceId, getService);
 *   router.put('/api/services/:id', validateServiceId, updateService);
 *   router.delete('/api/services/:id', validateServiceId, deleteService);
 *
 * @param req  Objeto de petición HTTP de Express. Se tipa `Request<{ id: string }>`
 *             para indicar que en los parámetros de ruta esperamos una propiedad `id`.
 * @param res  Objeto de respuesta HTTP de Express, usado para devolver el error 400 si aplica.
 * @param next Función de Express que transfiere el control al siguiente middleware/handler
 *             si la validación es correcta.
 */
export function validateServiceId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  /* Extrae el parámetro `id` de la URL, por ejemplo:
  GET /api/services/4956c3a6-7f88-47b6-99de-870b700f7aab → id = '4956c3a6-7f88-47b6-99de-870b700f7aab' */
  const { id } = req.params;

  // Valida que exista y que tenga al menos 36 caracteres (tamaño típico de un UUID v4)
  if (!id || id.length < 36) 
  {
    /* Si el `id` no pasa la validación, respondemos con 400 (Bad Request)
    y NO llamamos a `next()`, por lo que el controlador principal nunca se ejecuta. */
    return res.status(400).json(
    { 
      message: 'Parámetro id inválido' 
    });
  }

  /* Si la validación es correcta, delega la ejecución al siguiente middleware/controlador.
  En este punto, el handler (`getService`, `updateService`, deleteService.) ya puede asumir
  que `req.params.id` tiene al menos una forma razonable. */
  next();
}


/**
 * Middleware de validación para el parámetro `id` de la ruta de Session.
 *
 * Propósito:
 * - Asegurarse de que el `id` recibido en `req.params` tenga un formato mínimamente válido
 *   antes de llegar al controlador (handler) principal.
 * - Si el `id` es inválido, corta la ejecución de la cadena de middlewares y responde
 *   con un error 400 (Bad Request).
 *
 * Uso típico en rutas:
 *   router.get('/api/sessions/:id', validateSessionId, getSession);
 *   router.put('/api/sessions/:id', validateSessionId, updateSession);
 *   router.delete('/api/sessions/:id', validateSessionId, deleteSession);
 *
 * @param req  Objeto de petición HTTP de Express. Se tipa `Request<{ id: string }>`
 *             para indicar que en los parámetros de ruta esperamos una propiedad `id`.
 * @param res  Objeto de respuesta HTTP de Express, usado para devolver el error 400 si aplica.
 * @param next Función de Express que transfiere el control al siguiente middleware/handler
 *             si la validación es correcta.
 */
export function validateSessionId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  /* Extrae el parámetro `id` de la URL, por ejemplo:
  GET /api/sessions/aa823acf-0e6b-4019-876a-f90af1bcaa4c → id = 'aa823acf-0e6b-4019-876a-f90af1bcaa4c' */
  const { id } = req.params;

  // Valida que exista y que tenga al menos 36 caracteres (tamaño típico de un UUID v4)
  if (!id || id.length < 36) 
  {
    /*Si el `id` no pasa la validación, respondemos con 400 (Bad Request)
    y NO llamamos a `next()`, por lo que el controlador principal nunca se ejecuta. */
    return res.status(400).json(
    { 
      message: 'Parámetro id inválido' 
    });
  }

  /*Si la validación es correcta, delega la ejecución al siguiente middleware/controlador.
  En este punto, el handler (`getSession`, `updateSession`, deleteSession.) ya puede asumir
  que `req.params.id` tiene al menos una forma razonable.*/
  next();
}


/**
 * Middleware de validación para el parámetro `id` de la ruta de Payment.
 *
 * Propósito:
 * - Asegurarse de que el `id` recibido en `req.params` tenga un formato mínimamente válido
 *   antes de llegar al controlador (handler) principal.
 * - Si el `id` es inválido, corta la ejecución de la cadena de middlewares y responde
 *   con un error 400 (Bad Request).
 *
 * Uso típico en rutas:
 *   router.get('/api/payments/:id', validatePaymentId, getPayment);
 *   router.put('/api/payments/:id', validatePaymentId, updatePayment);
 *   router.delete('/api/payments/:id', validatePaymentId, deletePayment);
 *
 * @param req  Objeto de petición HTTP de Express. Se tipa `Request<{ id: string }>`
 *             para indicar que en los parámetros de ruta esperamos una propiedad `id`.
 * @param res  Objeto de respuesta HTTP de Express, usado para devolver el error 400 si aplica.
 * @param next Función de Express que transfiere el control al siguiente middleware/handler
 *             si la validación es correcta.
 */
export function validatePaymentId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  /* Extrae el parámetro `id` de la URL, por ejemplo:
  GET /api/payments/0c8722c1-edc2-485f-9f7c-686025c4306f  → id = '0c8722c1-edc2-485f-9f7c-686025c4306f' */
  const { id } = req.params;

  // Valida que exista y que tenga al menos 36 caracteres (tamaño típico de un UUID v4)
  if (!id || id.length < 36) 
  {
    /* Si el `id` no pasa la validación, respondemos con 400 (Bad Request)
    y NO llamamos a `next()`, por lo que el controlador principal nunca se ejecuta. */
    return res.status(400).json(
    { 
      message: 'Parámetro id inválido' 
    });
  }

  /*Si la validación es correcta, delega la ejecución al siguiente middleware/controlador.
  En este punto, el handler (`getPayment`, `updatePayment`, deletePayment.) ya puede asumir
  que `req.params.id` tiene al menos una forma razonable.*/
  next();
}


/**
 * Middleware de validación para el parámetro `id` de la ruta de Verification.
 *
 * Propósito:
 * - Asegurarse de que el `id` recibido en `req.params` tenga un formato mínimamente válido
 *   antes de llegar al controlador (handler) principal.
 * - Si el `id` es inválido, corta la ejecución de la cadena de middlewares y responde
 *   con un error 400 (Bad Request).
 *
 * Uso típico en rutas:
 *   router.get('/api/verifications/:id', validateVerificationId, getVerification);
 *   router.put('/api/verifications/:id', validateVerificationId, updateVerification);
 *   router.delete('/api/verifications/:id', validateVerificationId, deleteVerification);
 *
 * @param req  Objeto de petición HTTP de Express. Se tipa `Request<{ id: string }>`
 *             para indicar que en los parámetros de ruta esperamos una propiedad `id`.
 * @param res  Objeto de respuesta HTTP de Express, usado para devolver el error 400 si aplica.
 * @param next Función de Express que transfiere el control al siguiente middleware/handler
 *             si la validación es correcta.
 */
export function validateVerificationId(req: Request<{ id: string }>, res: Response, next: NextFunction) 
{
  /* Extrae el parámetro `id` de la URL, por ejemplo:
  GET /api/verifications/a367c0ab-40fd-4221-939c-9676c409f264  → id = 'a367c0ab-40fd-4221-939c-9676c409f264' */
  const { id } = req.params;

  // Valida que exista y que tenga al menos 36 caracteres (tamaño típico de un UUID v4)
  if (!id || id.length < 36) 
  {
    /* Si el `id` no pasa la validación, respondemos con 400 (Bad Request)
    y NO llamamos a `next()`, por lo que el controlador principal nunca se ejecuta. */
    return res.status(400).json(
    { 
      message: 'Parámetro id inválido' 
    });
  }

  /* Si la validación es correcta, delega la ejecución al siguiente middleware/controlador.
  En este punto, el handler (`getVerification`, `updateVerification`, deleteVerification.) ya puede asumir
  que `req.params.id` tiene al menos una forma razonable. */
  next();
}