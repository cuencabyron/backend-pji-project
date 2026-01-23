// Importa Request y Response de Express para tipar correctamente los objetos simulados en las pruebas.
import { Request, Response } from 'express';

// Importa los handlers (controllers) que se van a probar.
// Cada uno representa una operación CRUD sobre el recurso Session.
import {
  listSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
} from '@/modules/session/session.controller';

// Importa las funciones del service.
// Se importan para poder:
// 1) Mockear el módulo completo con jest.mock
// 2) Castearlas a jest.Mock y controlar sus retornos por test
import {
  findAllSessions,
  findSessionById,
  createSessionService,
  updateSessionService,
  deleteSessionService,
} from '@/modules/session/session.service';

// Mock del módulo session.service.
// Sustituye las funciones reales por jest.fn(), aislando el controller de DB/ORM.
jest.mock('@/modules/session/session.service', () => (
{
  // Mock: listar todas las sesiones.
  findAllSessions: jest.fn(),

  // Mock: buscar una sesión por ID.
  findSessionById: jest.fn(),

  // Mock: crear una sesión.
  createSessionService: jest.fn(),

  // Mock: actualizar una sesión.
  updateSessionService: jest.fn(),

  // Mock: eliminar una sesión.
  deleteSessionService: jest.fn(),
}));

// Crea un Response falso de Express para poder inspeccionar llamadas a status/json/send.
// Implementa chaining: res.status(...).json(...)
function createMockResponse(): Response 
{
  // Se crea un objeto parcial para agregar únicamente los métodos usados en los tests.
  const res: Partial<Response> = {};

  // Mock de res.status: registra llamadas y retorna res para permitir encadenamiento.
  res.status = jest.fn().mockReturnValue(res);

  // Mock de res.json: registra llamadas y retorna res para permitir encadenamiento.
  res.json = jest.fn().mockReturnValue(res);

  // Mock de res.send: registra llamadas y retorna res para permitir encadenamiento.
  res.send = jest.fn().mockReturnValue(res);

  // Casteo a Response para cumplir el tipo requerido por los controllers.
  return res as Response;
}

// Agrupa todas las pruebas unitarias del SessionController.
describe('SessionController', () => 
{
  // Se ejecuta antes de cada test para reiniciar el estado de todos los mocks.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Aliases tipados a jest.Mock para poder usar mockResolvedValue/mockRejectedValue fácilmente.
  const mockFindAllSessions = findAllSessions as jest.Mock;
  const mockFindSessionById = findSessionById as jest.Mock;
  const mockCreateSessionService = createSessionService as jest.Mock;
  const mockUpdateSessionService = updateSessionService as jest.Mock;
  const mockDeleteSessionService = deleteSessionService as jest.Mock;

  // =========================================================
  //           listSessions (GET /api/sessions)
  // =========================================================
  it('GET listSessions → 200 y devuelve sessions', async () => 
  {
    // Arreglo simulado de sesiones que devolvería el service.
    const fakeSessions = [
      {
        // ID simulado de la sesión.
        session_id: 'sess-1',

        // ID del customer asociado a la sesión.
        customer_id: 'cust-1',

        // Cadena que identifica el cliente/navegador/herramienta (user agent).
        user_agent: 'PostmanRuntime',

        // Estado de la sesión (ej: active, ended).
        status: 'active',
      },
    ];

    // Configura el service para resolver con el arreglo simulado.
    mockFindAllSessions.mockResolvedValue(fakeSessions);

    // Request vacío: este endpoint no requiere params/body.
    const req = {} as Request;

    // Response mock para inspeccionar la respuesta.
    const res = createMockResponse();

    // Ejecuta el controller.
    await listSessions(req, res);

    // Verifica que el service se llamó exactamente una vez.
    expect(mockFindAllSessions).toHaveBeenCalledTimes(1);

    // Verifica que el controller devolvió el JSON con la lista.
    expect(res.json).toHaveBeenCalledWith(fakeSessions);
  });

  it('GET listSessions → 500 si el servicio falla', async () => 
  {
    // Spy a console.error para evitar ruido en la salida del test.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Configura el service para rechazar (simula error de DB).
    mockFindAllSessions.mockRejectedValue(new Error('DB error'));

    // Request vacío.
    const req = {} as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await listSessions(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Debe responder mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error listando sessions',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  // ============================================================================
  //                    getSession (GET /api/sessions/:id)
  // ============================================================================
  it('GET getSession → 200 si encuentra la session', async () => 
  {
    // Sesión simulada que el service devolvería si existe.
    const fakeSession = {
      session_id: 'sess-1',
      customer_id: 'cust-1',
      user_agent: 'PostmanRuntime',
      status: 'active',
    };

    // Configura el service para resolver con la sesión.
    mockFindSessionById.mockResolvedValue(fakeSession);

    // Request con params.id.
    const req = {
      params: { id: 'sess-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getSession(req, res);

    // Verifica que pidió el id correcto al service.
    expect(mockFindSessionById).toHaveBeenCalledWith('sess-1');

    // Verifica que devolvió la sesión encontrada.
    expect(res.json).toHaveBeenCalledWith(fakeSession);
  });

  it('GET getSession → 404 si no existe', async () => 
  {
    // Service devuelve null: no existe la sesión.
    mockFindSessionById.mockResolvedValue(null);

    // Request con id inexistente.
    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getSession(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Session no encontrada',
    });
  });

  it('GET getSession → 500 si el servicio falla', async () => 
  {
    // Spy a console.error para suprimir salida.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Service falla con error genérico.
    mockFindSessionById.mockRejectedValue(new Error('Fallo raro'));

    // Request con id válido.
    const req = {
      params: { id: 'sess-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getSession(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error obteniendo session',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  // ============================================================================
  //                    createSession (POST /api/sessions)
  // ============================================================================
  it('POST createSession → 201 cuando se crea correctamente', async () => 
  {
    // Body válido para crear sesión.
    const body = {
      customer_id: 'cust-1',
      user_agent: 'PostmanRuntime',
      status: 'active',
    };

    // Simula el objeto guardado con session_id asignado.
    const saved = {
      session_id: 'sess-1',
      ...body,
    };

    // Configura el service para devolver el objeto creado.
    mockCreateSessionService.mockResolvedValue(saved);

    // Request con body.
    const req = { body } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createSession(req, res);

    // Verifica que el controller llamó al service con el body.
    expect(mockCreateSessionService).toHaveBeenCalledWith(body);

    // Verifica status 201.
    expect(res.status).toHaveBeenCalledWith(201);

    // Verifica JSON con el objeto creado.
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('POST createSession → 400 si faltan campos obligatorios', async () => 
  {
    // Request con body incompleto: falta user_agent (comentado).
    const req = {
      body: {
        customer_id: 'cust-1',

        // Campo requerido faltante para probar validación.
        //user_agent: 'Firefox/120 Ubuntu',
      },
    } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createSession(req, res);

    // Debe responder 400 por validación.
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje de validación.
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id y user_agent son requeridos',
    });

    // El service NO debe llamarse si la validación falla.
    expect(mockCreateSessionService).not.toHaveBeenCalled();
  });

  it('POST createSession → 400 si CUSTOMER_NOT_FOUND', async () => 
  {
    // Body con customer_id inexistente.
    const body = {
      customer_id: 'cust-no',
      user_agent: 'PostmanRuntime',
      status: 'active',
    };

    // Error tipificado para representar que el customer no existe.
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';

    // Service rechaza con ese error.
    mockCreateSessionService.mockRejectedValue(error);

    // Request con body.
    const req = { body } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createSession(req, res);

    // Controller mapea CUSTOMER_NOT_FOUND a 400.
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje específico.
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe en la BD',
    });
  });

  it('POST createSession → 500 si el servicio falla', async () => 
  {
    // Spy a console.error para suprimir salida.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Service falla con error genérico.
    mockCreateSessionService.mockRejectedValue(new Error('Fallo general'));

    // Request con body de creación mínimo.
    const req = {
      body: {
        customer_id: 'cust-1',
        user_agent: 'PostmanRuntime',
      },
    } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createSession(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje controlado para error.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error creando session',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  // =========================================================
  //         updateSession (PUT /api/sessions/:id)
  // =========================================================
  it('PUT updateSession → 200 si se actualiza correctamente', async () => 
  {
    // Body válido de actualización.
    const body = {
      customer_id: 'cust-1',
      user_agent: 'Nuevo UA',
      status: 'ended',
    };

    // Objeto actualizado simulado.
    const updated = {
      session_id: 'sess-1',
      ...body,
    };

    // Service devuelve el objeto actualizado.
    mockUpdateSessionService.mockResolvedValue(updated);

    // Request con params.id + body.
    const req = {
      params: { id: 'sess-1' },
      body,
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateSession(req, res);

    // Verifica que llamó al service con id y body.
    expect(mockUpdateSessionService).toHaveBeenCalledWith('sess-1', body);

    // Verifica JSON con el actualizado.
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('PUT updateSession → 404 si no existe', async () => 
  {
    // Service devuelve null: no existe la sesión a actualizar.
    mockUpdateSessionService.mockResolvedValue(null);

    // Request con id inexistente.
    const req = {
      params: { id: 'no-existe' },
      body: {},
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateSession(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Session no encontrada',
    });
  });

  it('PUT updateSession → 400 si CUSTOMER_NOT_FOUND', async () => 
  {
    // Error tipificado: customer_id enviado no existe.
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';

    // Service rechaza con ese error.
    mockUpdateSessionService.mockRejectedValue(error);

    // Request intentando actualizar la sesión con customer_id inválido.
    const req = {
      params: { id: 'sess-1' },
      body: { customer_id: 'cust-no' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateSession(req, res);

    // Mapea a 400.
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje específico.
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe en la BD',
    });
  });

  it('PUT updateSession → 500 si el servicio falla', async () => 
  {
    // Spy para suprimir logs.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Error genérico en update.
    mockUpdateSessionService.mockRejectedValue(new Error('Fallo update'));

    // Request con id válido y body vacío.
    const req = {
      params: { id: 'sess-1' },
      body: {},
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateSession(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error actualizando session',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  // =========================================================
  //    deleteSession (DELETE /api/sessions/:id)
  // =========================================================
  it('DELETE deleteSession → 204 si se elimina', async () => 
  {
    // Service devuelve 1 para indicar que se eliminó una fila (éxito).
    mockDeleteSessionService.mockResolvedValue(1);

    // Request con id a eliminar.
    const req = {
      params: { id: 'sess-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deleteSession(req, res);

    // Verifica llamada con id correcto.
    expect(mockDeleteSessionService).toHaveBeenCalledWith('sess-1');

    // Debe responder 204 No Content.
    expect(res.status).toHaveBeenCalledWith(204);

    // Debe finalizar la respuesta sin body.
    expect(res.send).toHaveBeenCalled();
  });

  it('DELETE deleteSession → 404 si no se elimina nada', async () => 
  {
    // Service devuelve 0 para indicar que no se eliminó nada (no existía).
    mockDeleteSessionService.mockResolvedValue(0);

    // Request con id inexistente.
    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deleteSession(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Session no encontrada',
    });
  });

  it('DELETE deleteSession → 500 si el servicio falla', async () => 
  {
    // Spy para suprimir logs.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Service rechaza con error genérico.
    mockDeleteSessionService.mockRejectedValue(new Error('Error borrando'));

    // Request con id válido.
    const req = {
      params: { id: 'sess-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deleteSession(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error eliminando session',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });
});