// src/utils/api-error.ts

/**
 * Forma estándar de la respuesta de error que devolverá la API.
 */
export type ApiErrorResponse = 
{
  /** Mensaje amigable para el cliente / frontend */
  message: string;
  /** Código técnico estable para identificar el tipo de error */
  errorId: string;
  /** Detalle técnico del error (útil para logs o desarrollo) */
  details?: string;
};

/**
 * Crea un objeto de error con formato unificado para la API.
 *
 * @param message Mensaje descriptivo para el cliente.
 * @param errorId Código técnico (ej. 'CUSTOMER_CREATE_ERROR').
 * @param err     Error original capturado en el catch.
 */
export function formatError(
  message: string,
  errorId: string,
  err: unknown
): ApiErrorResponse {
  const anyErr = err as any;

  return {
    message,
    errorId,
    // En desarrollo es útil ver el detalle real del error
    details: anyErr?.message ?? String(err),
  };
}