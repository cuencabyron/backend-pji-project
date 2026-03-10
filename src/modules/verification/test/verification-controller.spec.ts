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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFindAll = findAllVerifications as jest.Mock;
  const mockFindById = findVerificationById as jest.Mock;
  const mockCreate = createVerificationService as jest.Mock;
  const mockUpdate = updateVerificationService as jest.Mock;
  const mockDelete = deleteVerificationService as jest.Mock;

  // ======================================================
  // listVerifications
  // ======================================================

  it('listVerifications → devuelve verifications', async () => 
  {
    const fake = [{ verification_id: '1' }];

    mockFindAll.mockResolvedValue(fake);

    const res = createMockResponse();

    await listVerifications({} as Request, res);

    expect(mockFindAll).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(fake);

  });

  it('listVerifications → 500 si falla el service', async () => 
  {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockFindAll.mockRejectedValue(new Error());

    const res = createMockResponse();

    await listVerifications({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error listando verifications',
    });

  });

  // ======================================================
  // getVerification
  // ======================================================

  it('getVerification → devuelve verification si existe', async () => 
  {
    const fake = { verification_id: '1' };

    mockFindById.mockResolvedValue(fake);

    const req = { params: { id: '1' } } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getVerification(req, res);

    expect(mockFindById).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith(fake);

  });

  it('getVerification → 404 si no existe', async () => 
  {
    mockFindById.mockResolvedValue(null);

    const req = { params: { id: '10' } } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);

  });

  // ======================================================
  // createVerification
  // ======================================================

  it('createVerification → 400 si faltan campos', async () => 
  {
    const req = {
      body: { customer_id: '1' },
    } as Request;

    const res = createMockResponse();

    await createVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockCreate).not.toHaveBeenCalled();

  });

  it('createVerification → 201 si se crea correctamente', async () => 
  {
    const body = {
      customer_id: '1',
      session_id: '2',
      payment_id: '3',
      type: 'identity',
      attempts: 1,
      status: 'pending',
    };

    const saved = { verification_id: '1', ...body };

    mockCreate.mockResolvedValue(saved);

    const req = { body } as Request;
    const res = createMockResponse();

    await createVerification(req, res);

    expect(mockCreate).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);

  });

  // ======================================================
  // updateVerification
  // ======================================================

  it('updateVerification → actualiza correctamente', async () => 
  {
    const updated = { verification_id: '1', status: 'approved' };

    mockUpdate.mockResolvedValue(updated);

    const req = {
      params: { id: '1' },
      body: { status: 'approved' },
    } as unknown as Request<{ id: string }>;

    const res = createMockResponse();

    await updateVerification(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);

  });

  it('updateVerification → 404 si no existe', async () => 
  {
    mockUpdate.mockResolvedValue(null);

    const req = {
      params: { id: '10' },
      body: {},
    } as unknown as Request<{ id: string }>;

    const res = createMockResponse();

    await updateVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);

  });

  // ======================================================
  // deleteVerification
  // ======================================================

  it('deleteVerification → 204 si elimina', async () => 
  {
    mockDelete.mockResolvedValue(1);

    const req = { params: { id: '1' } } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteVerification(req, res);

    expect(mockDelete).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(204);

  });

  it('deleteVerification → 404 si no existe', async () => 
  {
    mockDelete.mockResolvedValue(0);

    const req = { params: { id: '10' } } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);

  });

});