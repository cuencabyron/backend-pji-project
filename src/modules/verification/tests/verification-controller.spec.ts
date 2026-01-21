import { Request, Response } from 'express';
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

jest.mock('@/modules/verification/verification.service', () => (
{
  findAllVerifications: jest.fn(),
  findVerificationById: jest.fn(),
  createVerificationService: jest.fn(),
  updateVerificationService: jest.fn(),
  deleteVerificationService: jest.fn(),
}));

function createMockResponse() 
{
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('VerificationController', () => 
{
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFindAllVerifications = findAllVerifications as jest.Mock;
  const mockFindVerificationById = findVerificationById as jest.Mock;
  const mockCreateVerificationService = createVerificationService as jest.Mock;
  const mockUpdateVerificationService = updateVerificationService as jest.Mock;
  const mockDeleteVerificationService = deleteVerificationService as jest.Mock;

  // =========================================================
  //         listVerifications (GET /api/verifications)
  // =========================================================
  it('listVerifications → 200 y devuelve verifications', async () => 
  {
    const fakeVerifications = [
      {
        verification_id: 'ver-1',
        customer_id: 'cust-1',
        session_id: 'sess-1',
        payment_id: 'pay-1',
        type: 'email',
        status: 'pending',
        attempts: 1,
      },
    ];

    mockFindAllVerifications.mockResolvedValue(fakeVerifications);

    const req = {} as Request;
    const res = createMockResponse();

    await listVerifications(req, res);

    expect(mockFindAllVerifications).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(fakeVerifications);
  });

  it('listVerifications → 500 si el servicio falla', async () => 
  {
    mockFindAllVerifications.mockRejectedValue(new Error('DB error'));

    const req = {} as Request;
    const res = createMockResponse();

    await listVerifications(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error listando verifications',
    });
  });

  // ============================================================================
  //                  getVerification (GET /api/verifications/:id)
  // ============================================================================
  it('getVerification → 200 si existe', async () => 
  {
    const fakeVerification = {
      verification_id: 'ver-1',
      customer_id: 'cust-1',
      session_id: 'sess-1',
      payment_id: 'pay-1',
      type: 'email',
      status: 'pending',
      attempts: 1,
    };

    mockFindVerificationById.mockResolvedValue(fakeVerification);

    const req = {
      params: { id: 'ver-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getVerification(req, res);

    expect(mockFindVerificationById).toHaveBeenCalledWith('ver-1');
    expect(res.json).toHaveBeenCalledWith(fakeVerification);
  });

  it('getVerification → 404 si no existe', async () => 
  {
    mockFindVerificationById.mockResolvedValue(null);

    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Verification no encontrada',
    });
  });

  it('getVerification → 500 si el servicio falla', async () => 
  {
    mockFindVerificationById.mockRejectedValue(new Error('Fallo raro'));

    const req = {
      params: { id: 'ver-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error obteniendo verification',
    });
  });

  // ============================================================================
  //                  createVerification (POST /api/verifications)
  // ============================================================================
  it('createVerification → 201 cuando se crea correctamente', async () => 
  {
    const body = {
      customer_id: 'cust-1',
      session_id: 'sess-1',
      payment_id: 'pay-1',
      type: 'email',
      status: 'pending',
      attempts: 1,
    };

    const saved = {
      verification_id: 'ver-1',
      ...body,
    };

    mockCreateVerificationService.mockResolvedValue(saved);

    const req = { body } as Request;
    const res = createMockResponse();

    await createVerification(req, res);

    expect(mockCreateVerificationService).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('createVerification → 400 si faltan campos obligatorios', async () => 
  {
    const req = {
      body: {
        // falta session_id, payment_id, type o attempts
        customer_id: 'cust-1',
      },
    } as Request;
    const res = createMockResponse();

    await createVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message:
        'customer_id, session_id, payment_id, type y attempts son requeridos',
    });
    expect(mockCreateVerificationService).not.toHaveBeenCalled();
  });

  it('createVerification → 400 si CUSTOMER_NOT_FOUND', async () => 
  {
    const body = {
      customer_id: 'cust-no',
      session_id: 'sess-1',
      payment_id: 'pay-1',
      type: 'email',
      status: 'pending',
      attempts: 1,
    };

    const error: any = new Error('customer_id no existe');
    error.code = 'CUSTOMER_NOT_FOUND';

    mockCreateVerificationService.mockRejectedValue(error);

    const req = { body } as Request;
    const res = createMockResponse();

    await createVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe',
    });
  });

  it('createVerification → 400 si SESSION_NOT_FOUND', async () => 
  {
    const body = {
      customer_id: 'cust-1',
      session_id: 'sess-no',
      payment_id: 'pay-1',
      type: 'email',
      status: 'pending',
      attempts: 1,
    };

    const error: any = new Error('session_id no existe');
    error.code = 'SESSION_NOT_FOUND';

    mockCreateVerificationService.mockRejectedValue(error);

    const req = { body } as Request;
    const res = createMockResponse();

    await createVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'session_id no existe',
    });
  });

  it('createVerification → 400 si PAYMENT_NOT_FOUND', async () => 
  {
    const body = {
      customer_id: 'cust-1',
      session_id: 'sess-1',
      payment_id: 'pay-no',
      type: 'email',
      status: 'pending',
      attempts: 1,
    };

    const error: any = new Error('payment_id no existe');
    error.code = 'PAYMENT_NOT_FOUND';

    mockCreateVerificationService.mockRejectedValue(error);

    const req = { body } as Request;
    const res = createMockResponse();

    await createVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'payment_id no existe',
    });
  });

  it('createVerification → 500 si el servicio falla', async () => 
  {
    mockCreateVerificationService.mockRejectedValue(
      new Error('Error inesperado'),
    );

    const req = {
      body: {
        customer_id: 'cust-1',
        session_id: 'sess-1',
        payment_id: 'pay-1',
        type: 'email',
        attempts: 1,
      },
    } as Request;
    const res = createMockResponse();

    await createVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error creando verification',
    });
  });

  // =========================================================
  //       updateVerification (PUT /api/verifications/:id)
  // =========================================================
  it('updateVerification → 200 cuando se actualiza correctamente', async () => 
  {
    const body = {
      customer_id: 'cust-1',
      session_id: 'sess-1',
      payment_id: 'pay-1',
      type: 'sms',
      status: 'approved',
      attempts: 2,
    };

    const updated = {
      verification_id: 'ver-1',
      ...body,
    };

    mockUpdateVerificationService.mockResolvedValue(updated);

    const req = {
      params: { id: 'ver-1' },
      body,
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateVerification(req, res);

    expect(mockUpdateVerificationService).toHaveBeenCalledWith('ver-1', body);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('updateVerification → 404 si no existe', async () => 
  {
    mockUpdateVerificationService.mockResolvedValue(null);

    const req = {
      params: { id: 'no-existe' },
      body: {},
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Verification no encontrada',
    });
  });

  it('updateVerification → 400 si CUSTOMER_NOT_FOUND', async () => 
  {
    const error: any = new Error('customer_id no existe');
    error.code = 'CUSTOMER_NOT_FOUND';

    mockUpdateVerificationService.mockRejectedValue(error);

    const req = {
      params: { id: 'ver-1' },
      body: { customer_id: 'cust-no' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe',
    });
  });

  it('updateVerification → 400 si SESSION_NOT_FOUND', async () => 
  {
    const error: any = new Error('session_id no existe');
    error.code = 'SESSION_NOT_FOUND';

    mockUpdateVerificationService.mockRejectedValue(error);

    const req = {
      params: { id: 'ver-1' },
      body: { session_id: 'sess-no' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'session_id no existe',
    });
  });

  it('updateVerification → 400 si PAYMENT_NOT_FOUND', async () => 
  {
    const error: any = new Error('payment_id no existe');
    error.code = 'PAYMENT_NOT_FOUND';

    mockUpdateVerificationService.mockRejectedValue(error);

    const req = {
      params: { id: 'ver-1' },
      body: { payment_id: 'pay-no' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'payment_id no existe',
    });
  });

  it('updateVerification → 500 si el servicio falla', async () => 
  {
    mockUpdateVerificationService.mockRejectedValue(
      new Error('Error inesperado'),
    );

    const req = {
      params: { id: 'ver-1' },
      body: {},
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error actualizando verification',
    });
  });

  // =========================================================
  //    deleteVerification (DELETE /api/verifications/:id)
  // =========================================================
  it('deleteVerification → 204 si se elimina', async () => 
  {
    mockDeleteVerificationService.mockResolvedValue(1);

    const req = {
      params: { id: 'ver-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteVerification(req, res);

    expect(mockDeleteVerificationService).toHaveBeenCalledWith('ver-1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deleteVerification → 404 si no se elimina nada', async () => 
  {
    mockDeleteVerificationService.mockResolvedValue(0);

    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Verification no encontrada',
    });
  });

  it('deleteVerification → 500 si el servicio falla', async () => 
  {
    mockDeleteVerificationService.mockRejectedValue(
      new Error('Error eliminando'),
    );

    const req = {
      params: { id: 'ver-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteVerification(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error eliminando verification',
    });
  });
});