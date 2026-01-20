// src/modules/verification/__tests__/verification.controller.spec.ts
import type { Request, Response } from 'express';
import {
  listVerifications,
  getVerification,
  createVerification,
  updateVerification,
  deleteVerification,
} from '@/modules/verification/verification.controller';

import {
  findAllVerifications,
  findVerificationById,
  createVerificationService,
  updateVerificationService,
  deleteVerificationService,
} from '@/modules/verification/verification.service';

jest.mock('@/modules/verification/verification.service', () => ({
  findAllVerifications: jest.fn(),
  findVerificationById: jest.fn(),
  createVerificationService: jest.fn(),
  updateVerificationService: jest.fn(),
  deleteVerificationService: jest.fn(),
}));

function createMockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('VerificationController', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockedFindAll = findAllVerifications as jest.Mock;
  const mockedFindById = findVerificationById as jest.Mock;
  const mockedCreate = createVerificationService as jest.Mock;
  const mockedUpdate = updateVerificationService as jest.Mock;
  const mockedDelete = deleteVerificationService as jest.Mock;

  // ============================================================================
  //                    listVerifications (GET /api/verifications)
  // ============================================================================
  it('listVerifications → 200', async () => 
  {
    mockedFindAll.mockResolvedValue([{ verification_id: 'v1' }]);
    const res = createMockResponse();

    await listVerifications({} as Request, res);

    expect(res.json).toHaveBeenCalledWith([{ verification_id: 'v1' }]);
  });

  it('getVerification → 404 si no existe', async () => 
  {
    mockedFindById.mockResolvedValue(null);

    const req = { 
      params: { id: 'no' }, 
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  // ============================================================================
  //                    createVerification (POST /api/verifications)
  // ============================================================================
  it('createVerification → 400 si faltan campos', async () => 
  {
    // faltan payment_id, type, attempts, etc.
    const req = {
      body: { customer_id: 'c1', session_id: 's1' },
    } as Request;
    const res = createMockResponse();

    await createVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createVerification → 201 si se crea', async () => 
  {
    const saved = { verification_id: 'v1' };
    mockedCreate.mockResolvedValue(saved);

    const req = {
      body: {
        customer_id: 'c1',
        session_id: 's1',
        payment_id: 'p1',
        type: 'sms',
        status: 'pending',
        attempts: 1,
      },
    } as Request;
    const res = createMockResponse();

    await createVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  // ============================================================================
  //                 updateVerification (PUT /api/verification/:id)
  // ============================================================================
  it('updateVerification → 404 si no existe', async () => 
  {
    mockedUpdate.mockResolvedValue(null);

    const req = {
      params: { id: 'no' },
      body: { status: 'approved' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updateVerification → 200 si actualiza', async () => 
  {
    const updated = { verification_id: 'v1', status: 'approved' };
    mockedUpdate.mockResolvedValue(updated);

    const req = {
      params: { id: 'v1' },
      body: { status: 'approved' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateVerification(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  // ============================================================================
  //                deleteVerification (DELETE /api/verifications/:id)
  // ============================================================================
  it('deleteVerification → 204 si elimina', async () => 
  {
    mockedDelete.mockResolvedValue(1);

    const req = { 
      params: { id: 'v1' }, 
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deleteVerification → 404 si no existe', async () => 
  {
    mockedDelete.mockResolvedValue(0);

    const req = { 
      params: { id: 'no' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});