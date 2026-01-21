import { Request, Response } from 'express';
import {
  listSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
} from '@/modules/session/session.controller';

import {
  findAllSessions,
  findSessionById,
  createSessionService,
  updateSessionService,
  deleteSessionService,
} from '@/modules/session/session.service';

jest.mock('@/modules/session/session.service', () => (
{
  findAllSessions: jest.fn(),
  findSessionById: jest.fn(),
  createSessionService: jest.fn(),
  updateSessionService: jest.fn(),
  deleteSessionService: jest.fn(),
}));

function createMockResponse(): Response 
{
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('SessionController', () => 
{
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFindAllSessions = findAllSessions as jest.Mock;
  const mockFindSessionById = findSessionById as jest.Mock;
  const mockCreateSessionService = createSessionService as jest.Mock;
  const mockUpdateSessionService = updateSessionService as jest.Mock;
  const mockDeleteSessionService = deleteSessionService as jest.Mock;

  // =========================
  // listSessions
  // =========================
  it('listSessions → 200 y devuelve sessions', async () => {
    const fakeSessions = [
      {
        session_id: 'sess-1',
        customer_id: 'cust-1',
        user_agent: 'PostmanRuntime',
        status: 'active',
      },
    ];

    mockFindAllSessions.mockResolvedValue(fakeSessions);

    const req = {} as Request;
    const res = createMockResponse();

    await listSessions(req, res);

    expect(mockFindAllSessions).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(fakeSessions);
  });

  it('listSessions → 500 si el servicio falla', async () => {
    mockFindAllSessions.mockRejectedValue(new Error('DB error'));

    const req = {} as Request;
    const res = createMockResponse();

    await listSessions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error listando sessions',
    });
  });

  // =========================
  // getSession
  // =========================
  it('getSession → 200 si encuentra la session', async () => {
    const fakeSession = {
      session_id: 'sess-1',
      customer_id: 'cust-1',
      user_agent: 'PostmanRuntime',
      status: 'active',
    };

    mockFindSessionById.mockResolvedValue(fakeSession);

    const req = {
      params: { id: 'sess-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getSession(req, res);

    expect(mockFindSessionById).toHaveBeenCalledWith('sess-1');
    expect(res.json).toHaveBeenCalledWith(fakeSession);
  });

  it('getSession → 404 si no existe', async () => {
    mockFindSessionById.mockResolvedValue(null);

    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getSession(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Session no encontrada',
    });
  });

  it('getSession → 500 si el servicio falla', async () => {
    mockFindSessionById.mockRejectedValue(new Error('Fallo raro'));

    const req = {
      params: { id: 'sess-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getSession(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error obteniendo session',
    });
  });

  // =========================
  // createSession
  // =========================
  it('createSession → 201 cuando se crea correctamente', async () => {
    const body = {
      customer_id: 'cust-1',
      user_agent: 'PostmanRuntime',
      status: 'active',
    };

    const saved = {
      session_id: 'sess-1',
      ...body,
    };

    mockCreateSessionService.mockResolvedValue(saved);

    const req = { body } as Request;
    const res = createMockResponse();

    await createSession(req, res);

    expect(mockCreateSessionService).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('createSession → 400 si faltan campos obligatorios', async () => {
    const req = {
      body: {
        // falta customer_id o user_agent
        customer_id: 'cust-1',
      },
    } as Request;
    const res = createMockResponse();

    await createSession(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id, ip_address y user_agent son requeridos',
    });
    expect(mockCreateSessionService).not.toHaveBeenCalled();
  });

  it('createSession → 400 si CUSTOMER_NOT_FOUND', async () => {
    const body = {
      customer_id: 'cust-no',
      user_agent: 'PostmanRuntime',
      status: 'active',
    };

    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';

    mockCreateSessionService.mockRejectedValue(error);

    const req = { body } as Request;
    const res = createMockResponse();

    await createSession(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe en la BD',
    });
  });

  it('createSession → 500 si el servicio falla', async () => {
    mockCreateSessionService.mockRejectedValue(new Error('Fallo general'));

    const req = {
      body: {
        customer_id: 'cust-1',
        user_agent: 'PostmanRuntime',
      },
    } as Request;
    const res = createMockResponse();

    await createSession(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error creando session',
    });
  });

  // =========================
  // updateSession
  // =========================
  it('updateSession → 200 si se actualiza correctamente', async () => {
    const body = {
      customer_id: 'cust-1',
      user_agent: 'Nuevo UA',
      status: 'ended',
    };

    const updated = {
      session_id: 'sess-1',
      ...body,
    };

    mockUpdateSessionService.mockResolvedValue(updated);

    const req = {
      params: { id: 'sess-1' },
      body,
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateSession(req, res);

    expect(mockUpdateSessionService).toHaveBeenCalledWith('sess-1', body);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('updateSession → 404 si no existe', async () => {
    mockUpdateSessionService.mockResolvedValue(null);

    const req = {
      params: { id: 'no-existe' },
      body: {},
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateSession(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Session no encontrada',
    });
  });

  it('updateSession → 400 si CUSTOMER_NOT_FOUND', async () => {
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';

    mockUpdateSessionService.mockRejectedValue(error);

    const req = {
      params: { id: 'sess-1' },
      body: { customer_id: 'cust-no' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateSession(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe en la BD',
    });
  });

  it('updateSession → 500 si el servicio falla', async () => {
    mockUpdateSessionService.mockRejectedValue(new Error('Fallo update'));

    const req = {
      params: { id: 'sess-1' },
      body: {},
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateSession(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error actualizando session',
    });
  });

  // =========================
  // deleteSession
  // =========================
  it('deleteSession → 204 si se elimina', async () => {
    mockDeleteSessionService.mockResolvedValue(1);

    const req = {
      params: { id: 'sess-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteSession(req, res);

    expect(mockDeleteSessionService).toHaveBeenCalledWith('sess-1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deleteSession → 404 si no se elimina nada', async () => {
    mockDeleteSessionService.mockResolvedValue(0);

    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteSession(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Session no encontrada',
    });
  });

  it('deleteSession → 500 si el servicio falla', async () => {
    mockDeleteSessionService.mockRejectedValue(new Error('Error borrando'));

    const req = {
      params: { id: 'sess-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteSession(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error eliminando session',
    });
  });
});