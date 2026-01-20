// src/modules/session/__tests__/session.controller.spec.ts
import type { Request, Response } from 'express';
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

jest.mock('@/modules/session/session.service', () => ({
  findAllSessions: jest.fn(),
  findSessionById: jest.fn(),
  createSessionService: jest.fn(),
  updateSessionService: jest.fn(),
  deleteSessionService: jest.fn(),
}));

function createMockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('SessionController', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockedFindAll = findAllSessions as jest.Mock;
  const mockedFindById = findSessionById as jest.Mock;
  const mockedCreate = createSessionService as jest.Mock;
  const mockedUpdate = updateSessionService as jest.Mock;
  const mockedDelete = deleteSessionService as jest.Mock;

  // ============================================================================
  //                    listSessions (GET /api/Sessions)
  // ============================================================================
  it('listSessions → 200', async () => 
  {
    mockedFindAll.mockResolvedValue([{ session_id: 's1' }]);
    const res = createMockResponse();

    await listSessions({} as Request, res);

    expect(res.json).toHaveBeenCalledWith([{ session_id: 's1' }]);
  });

  it('getSession → 200 si existe', async () => 
  {
    mockedFindById.mockResolvedValue({ session_id: 's1' });

    const req = { 
      params: { id: 's1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getSession(req, res);

    expect(res.json).toHaveBeenCalledWith({ session_id: 's1' });
  });

  it('getSession → 404 si no existe', async () => {
    mockedFindById.mockResolvedValue(null);

    const req = { 
      params: { id: 'no' }, 
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getSession(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  // ============================================================================
  //                    createSession (POST /api/sessions)
  // ============================================================================
  it('createSession → 400 si faltan campos obligatorios', async () => 
  {
    const req = { body: { customer_id: 'c1', user_agente: 'Chrome/119 Win10' } } as Request; 
    const res = createMockResponse();

    await createSession(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createSession → 201 si se crea bien', async () => 
  {
    const saved = { session_id: 's1' };
    mockedCreate.mockResolvedValue(saved);

    const req = {
      body: { customer_id: 'c1', user_agent: 'Chrome/119 Win10', status: 'active' },
    } as Request;
    const res = createMockResponse();

    await createSession(req, res);

    expect(mockedCreate).toHaveBeenCalledWith({
      customer_id: 'c1',
      user_agent: 'Mozilla',
      status: 'active',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  // ============================================================================
  //                   updateSession (PUT /api/sessions/:id)
  // ============================================================================
  it('updateSession → 404 si no existe', async () => 
  {
    mockedUpdate.mockResolvedValue(null);

    const req = {
      params: { id: 'no' },
      body: { status: 'ended' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateSession(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updateSession → 200 si actualiza', async () => 
  {
    const updated = { session_id: 's1', status: 'ended' };
    mockedUpdate.mockResolvedValue(updated);

    const req = {
      params: { id: 's1' },
      body: { status: 'ended' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateSession(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  // ============================================================================
  //                  deleteSession (DELETE /api/sessions/:id)
  // ============================================================================
  it('deleteSession → 204 si elimina', async () => 
  {
    mockedDelete.mockResolvedValue(1);

    const req = { 
      params: { id: 's1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteSession(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deleteSession → 404 si no existe', async () => 
  {
    mockedDelete.mockResolvedValue(0);

    const req = { 
      params: { id: 'no' }, 
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteSession(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});