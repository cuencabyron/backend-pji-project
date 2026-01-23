// Importa Request y Response de Express para tipar correctamente los objetos simulados en pruebas.
import { Request, Response } from 'express';

// Importa los controllers (handlers) que se van a probar.
// Cada uno representa una operación CRUD sobre el recurso Verification.
import {
  listVerifications,
  getVerification,
  createVerification,
  updateVerification,
  deleteVerification,
} from '@/modules/verification/verification.controller';

// Importa las funciones del service.
// Se importan para poder:
// 1) Mockear el módulo completo con jest.mock
// 2) Castearlas a jest.Mock y controlar su comportamiento por test
import {
  findAllVerifications,
  findVerificationById,
  createVerificationService,
  updateVerificationService,
  deleteVerificationService,
} from '@/modules/verification/verification.service';

// Mock del módulo verification.service.
// Sustituye las funciones reales por jest.fn() para aislar el controller de DB/ORM.
jest.mock('@/modules/verification/verification.service', () => (
{
  // Mock: listar todas las verificaciones.
  findAllVerifications: jest.fn(),

  // Mock: buscar una verificación por ID.
  findVerificationById: jest.fn(),

  // Mock: crear una verificación.
  createVerificationService: jest.fn(),

  // Mock: actualizar una verificación.
  updateVerificationService: jest.fn(),

  // Mock: eliminar una verificación.
  deleteVerificationService: jest.fn(),
}));

// Crea un Response falso de Express.
// Nota: aquí se construye directamente como Response (a diferencia de otros archivos donde usas Partial<Response>).
// Se mockean status/json/send y se retorna el mismo res para soportar chaining.
function createMockResponse() 
{
  // Crea un objeto vacío y lo castea a Response.
  const res = {} as Response;

  // Mock de res.status: registra llamadas y retorna res para permitir encadenamiento.
  res.status = jest.fn().mockReturnValue(res);

  // Mock de res.json: registra llamadas y retorna res para permitir encadenamiento.
  res.json = jest.fn().mockReturnValue(res);

  // Mock de res.send: registra llamadas y retorna res para permitir encadenamiento.
  res.send = jest.fn().mockReturnValue(res);

  // Retorna el Response mock.
  return res;
}

// Agrupa todas las pruebas unitarias del VerificationController.
describe('VerificationController', () => 
{
  // Se ejecuta antes de cada prueba para limpiar el estado de los mocks.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Aliases tipados como jest.Mock para usar mockResolvedValue/mockRejectedValue.
  const mockFindAllVerifications = findAllVerifications as jest.Mock;
  const mockFindVerificationById = findVerificationById as jest.Mock;
  const mockCreateVerificationService = createVerificationService as jest.Mock;
  const mockUpdateVerificationService = updateVerificationService as jest.Mock;
  const mockDeleteVerificationService = deleteVerificationService as jest.Mock;

  // =========================================================
  //         listVerifications (GET /api/verifications)
  // =========================================================
  it('GET listVerifications → 200 y devuelve verifications', async () => 
  {
    // Arreglo simulado de verificaciones.
    const fakeVerifications = [
      {
        // ID simulado de la verificación.
        verification_id: 'ver-1',

        // ID del customer relacionado.
        customer_id: 'cust-1',

        // ID de la sesión relacionada.
        session_id: 'sess-1',

        // ID del pago relacionado.
        payment_id: 'pay-1',

        // Tipo de verificación (ej: email, sms).
        type: 'email',

        // Estado (ej: pending, approved, rejected).
        status: 'pending',

        // Número de intentos realizados.
        attempts: 1,
      },
    ];

    // Configura el service para devolver el arreglo simulado.
    mockFindAllVerifications.mockResolvedValue(fakeVerifications);

    // Request vacío (no requiere params/body).
    const req = {} as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await listVerifications(req, res);

    // Verifica que el service se llamó una vez.
    expect(mockFindAllVerifications).toHaveBeenCalledTimes(1);

    // Verifica que devolvió el arreglo en JSON.
    expect(res.json).toHaveBeenCalledWith(fakeVerifications);
  });

  it('GET listVerifications → 500 si el servicio falla', async () => 
  {
    // Spy a console.error para suprimir logs en el output del test.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Configura el service para rechazar (simula error de DB).
    mockFindAllVerifications.mockRejectedValue(new Error('DB error'));

    // Request vacío.
    const req = {} as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await listVerifications(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error listando verifications',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  // ============================================================================
  //                  getVerification (GET /api/verifications/:id)
  // ============================================================================
  it('GET getVerification → 200 si existe', async () => 
  {
    // Verificación simulada para el caso "encontrada".
    const fakeVerification = {
      verification_id: 'ver-1',
      customer_id: 'cust-1',
      session_id: 'sess-1',
      payment_id: 'pay-1',
      type: 'email',
      status: 'pending',
      attempts: 1,
    };

    // Configura el service para devolver la verificación.
    mockFindVerificationById.mockResolvedValue(fakeVerification);

    // Request con params.id.
    const req = {
      params: { id: 'ver-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getVerification(req, res);

    // Verifica que pidió al service el id correcto.
    expect(mockFindVerificationById).toHaveBeenCalledWith('ver-1');

    // Verifica que devolvió la verificación.
    expect(res.json).toHaveBeenCalledWith(fakeVerification);
  });

  it('GET getVerification → 404 si no existe', async () => 
  {
    // Service devuelve null: no existe.
    mockFindVerificationById.mockResolvedValue(null);

    // Request con id inexistente.
    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getVerification(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Verification no encontrada',
    });
  });

  it('GET getVerification → 500 si el servicio falla', async () => 
  {
    // Spy a console.error para suprimir salida.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Service falla con error genérico.
    mockFindVerificationById.mockRejectedValue(new Error('Fallo raro'));

    // Request con id válido.
    const req = {
      params: { id: 'ver-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getVerification(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error obteniendo verification',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  it('GET createVerification → 201 cuando se crea correctamente', async () => 
  {
    // Body válido para crear verificación.
    const body = {
      customer_id: 'cust-1',
      session_id: 'sess-1',
      payment_id: 'pay-1',
      type: 'email',
      status: 'pending',
      attempts: 1,
    };

    // Simula objeto guardado con verification_id asignado.
    const saved = {
      verification_id: 'ver-1',
      ...body,
    };

    // Configura el service para devolver el objeto creado.
    mockCreateVerificationService.mockResolvedValue(saved);

    // Request con body.
    const req = { body } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createVerification(req, res);

    // Verifica llamada al service con el body.
    expect(mockCreateVerificationService).toHaveBeenCalledWith(body);

    // Verifica status 201 (Created).
    expect(res.status).toHaveBeenCalledWith(201);

    // Verifica JSON con el objeto creado.
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('GET createVerification → 400 si faltan campos obligatorios', async () => 
  {
    // Body incompleto: falta payment_id (comentado).
    const req = {
      body: {
        customer_id: 'cust-1',
        session_id: 'sess-1',

        // Campo requerido faltante para forzar validación.
        //payment_id: 'pay-1',

        type: 'sms',
        attempts: 3,
      },
    } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createVerification(req, res);

    // Debe responder 400.
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje de validación (según tus reglas).
    expect(res.json).toHaveBeenCalledWith({
      message:
        'customer_id, session_id, payment_id, type y attempts son requeridos',
    });

    // El service no debe ejecutarse si falla la validación.
    expect(mockCreateVerificationService).not.toHaveBeenCalled();
  });


  // ============================================================================
  //                  createVerification (POST /api/verifications)
  // ============================================================================
  it('POST createVerification → 400 si CUSTOMER_NOT_FOUND', async () => 
  {
    // Body con customer_id inexistente.
    const body = {
      customer_id: 'cust-no',
      session_id: 'sess-1',
      payment_id: 'pay-1',
      type: 'email',
      status: 'pending',
      attempts: 1,
    };

    // Error tipificado: customer no existe.
    const error: any = new Error('customer_id no existe');
    error.code = 'CUSTOMER_NOT_FOUND';

    // Service rechaza con error tipificado.
    mockCreateVerificationService.mockRejectedValue(error);

    // Request con body.
    const req = { body } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createVerification(req, res);

    // Mapea a 400 según tus reglas.
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje específico (nota: aquí el mensaje es distinto a otros módulos: 'customer_id no existe').
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe',
    });
  });

  it('POST createVerification → 400 si SESSION_NOT_FOUND', async () => 
  {
    // Body con session_id inexistente.
    const body = {
      customer_id: 'cust-1',
      session_id: 'sess-no',
      payment_id: 'pay-1',
      type: 'email',
      status: 'pending',
      attempts: 1,
    };

    // Error tipificado: session no existe.
    const error: any = new Error('session_id no existe');
    error.code = 'SESSION_NOT_FOUND';

    // Service rechaza con error tipificado.
    mockCreateVerificationService.mockRejectedValue(error);

    // Request con body.
    const req = { body } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createVerification(req, res);

    // Debe responder 400.
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje específico.
    expect(res.json).toHaveBeenCalledWith({
      message: 'session_id no existe',
    });
  });

  it('POST createVerification → 400 si PAYMENT_NOT_FOUND', async () => 
  {
    // Body con payment_id inexistente.
    const body = {
      customer_id: 'cust-1',
      session_id: 'sess-1',
      payment_id: 'pay-no',
      type: 'email',
      status: 'pending',
      attempts: 1,
    };

    // Error tipificado: payment no existe.
    const error: any = new Error('payment_id no existe');
    error.code = 'PAYMENT_NOT_FOUND';

    // Service rechaza con error tipificado.
    mockCreateVerificationService.mockRejectedValue(error);

    // Request con body.
    const req = { body } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createVerification(req, res);

    // Debe responder 400.
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje específico.
    expect(res.json).toHaveBeenCalledWith({
      message: 'payment_id no existe',
    });
  });

  it('POST createVerification → 500 si el servicio falla', async () => 
  {
    // Spy para suprimir logs.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Service falla con error genérico inesperado.
    mockCreateVerificationService.mockRejectedValue(
      new Error('Error inesperado'),
    );

    // Request con body (nota: aquí falta status; depende de tu controller si es opcional).
    const req = {
      body: {
        customer_id: 'cust-1',
        session_id: 'sess-1',
        payment_id: 'pay-1',
        type: 'email',
        attempts: 1,
      },
    } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createVerification(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error creando verification',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  // =========================================================
  //       updateVerification (PUT /api/verifications/:id)
  // =========================================================
  it('PUT updateVerification → 200 cuando se actualiza correctamente', async () => 
  {
    // Body válido para actualización.
    const body = {
      customer_id: 'cust-1',
      session_id: 'sess-1',
      payment_id: 'pay-1',
      type: 'sms',
      status: 'approved',
      attempts: 2,
    };

    // Objeto actualizado simulado.
    const updated = {
      verification_id: 'ver-1',
      ...body,
    };

    // Service devuelve el actualizado.
    mockUpdateVerificationService.mockResolvedValue(updated);

    // Request con params.id y body.
    const req = {
      params: { id: 'ver-1' },
      body,
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateVerification(req, res);

    // Verifica llamada al service con id y body.
    expect(mockUpdateVerificationService).toHaveBeenCalledWith('ver-1', body);

    // Verifica JSON con el actualizado.
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('PUT updateVerification → 404 si no existe', async () => 
  {
    // Service devuelve null: no existe la verificación.
    mockUpdateVerificationService.mockResolvedValue(null);

    // Request con id inexistente.
    const req = {
      params: { id: 'no-existe' },
      body: {},
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateVerification(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Verification no encontrada',
    });
  });

  it('PUT updateVerification → 400 si CUSTOMER_NOT_FOUND', async () => 
  {
    // Error tipificado: customer_id no existe.
    const error: any = new Error('customer_id no existe');
    error.code = 'CUSTOMER_NOT_FOUND';

    // Service rechaza con error.
    mockUpdateVerificationService.mockRejectedValue(error);

    // Request intentando actualizar con customer_id inválido.
    const req = {
      params: { id: 'ver-1' },
      body: { customer_id: 'cust-no' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateVerification(req, res);

    // Debe responder 400.
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje específico.
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe',
    });
  });

  it('PUT updateVerification → 400 si SESSION_NOT_FOUND', async () => 
  {
    // Error tipificado: session_id no existe.
    const error: any = new Error('session_id no existe');
    error.code = 'SESSION_NOT_FOUND';

    // Service rechaza con error.
    mockUpdateVerificationService.mockRejectedValue(error);

    // Request intentando actualizar con session_id inválido.
    const req = {
      params: { id: 'ver-1' },
      body: { session_id: 'sess-no' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateVerification(req, res);

    // Debe responder 400.
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje específico.
    expect(res.json).toHaveBeenCalledWith({
      message: 'session_id no existe',
    });
  });

  it('PUT updateVerification → 400 si PAYMENT_NOT_FOUND', async () => 
  {
    // Error tipificado: payment_id no existe.
    const error: any = new Error('payment_id no existe');
    error.code = 'PAYMENT_NOT_FOUND';

    // Service rechaza con error.
    mockUpdateVerificationService.mockRejectedValue(error);

    // Request intentando actualizar con payment_id inválido.
    const req = {
      params: { id: 'ver-1' },
      body: { payment_id: 'pay-no' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateVerification(req, res);

    // Debe responder 400.
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje específico.
    expect(res.json).toHaveBeenCalledWith({
      message: 'payment_id no existe',
    });
  });

  it('PUT updateVerification → 500 si el servicio falla', async () => 
  {
    // Spy para suprimir logs.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Error genérico inesperado.
    mockUpdateVerificationService.mockRejectedValue(
      new Error('Error inesperado'),
    );

    // Request con id válido y body vacío.
    const req = {
      params: { id: 'ver-1' },
      body: {},
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateVerification(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error actualizando verification',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  // =========================================================
  //    deleteVerification (DELETE /api/verifications/:id)
  // =========================================================
  it('DELETE deleteVerification → 204 si se elimina', async () => 
  {
    // Service devuelve 1: se eliminó una fila.
    mockDeleteVerificationService.mockResolvedValue(1);

    // Request con id a eliminar.
    const req = {
      params: { id: 'ver-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deleteVerification(req, res);

    // Verifica llamada con id correcto.
    expect(mockDeleteVerificationService).toHaveBeenCalledWith('ver-1');

    // Debe responder 204 No Content.
    expect(res.status).toHaveBeenCalledWith(204);

    // Debe finalizar respuesta sin body.
    expect(res.send).toHaveBeenCalled();
  });

  it('DELETE deleteVerification → 404 si no se elimina nada', async () => 
  {
    // Service devuelve 0: no existía la verificación.
    mockDeleteVerificationService.mockResolvedValue(0);

    // Request con id inexistente.
    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deleteVerification(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Verification no encontrada',
    });
  });

  it('DELETE deleteVerification → 500 si el servicio falla', async () => 
  {
    // Spy para suprimir logs.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Service rechaza con error genérico.
    mockDeleteVerificationService.mockRejectedValue(
      new Error('Error eliminando'),
    );

    // Request con id válido.
    const req = {
      params: { id: 'ver-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deleteVerification(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error eliminando verification',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });
});