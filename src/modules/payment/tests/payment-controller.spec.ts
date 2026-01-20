// src/modules/payment/__tests__/payment.controller.spec.ts
import type { Request, Response } from 'express';
import {
  listPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
} from '@/modules/payment/payment.controller';

import {
  findAllPayments,
  findPaymentById,
  createPaymentService,
  updatePaymentService,
  deletePaymentService,
} from '@/modules/payment/payment.service';

jest.mock('@/modules/payment/payment.service', () => ({
  findAllPayments: jest.fn(),
  findPaymentById: jest.fn(),
  createPaymentService: jest.fn(),
  updatePaymentService: jest.fn(),
  deletePaymentService: jest.fn(),
}));

function createMockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('PaymentController', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockedFindAll = findAllPayments as jest.Mock;
  const mockedFindById = findPaymentById as jest.Mock;
  const mockedCreate = createPaymentService as jest.Mock;
  const mockedUpdate = updatePaymentService as jest.Mock;
  const mockedDelete = deletePaymentService as jest.Mock;

  // ============================================================================
  //                    listPayments (GET /api/payments)
  // ============================================================================
  it('listPayments → 200', async () => 
    {
    mockedFindAll.mockResolvedValue([{ payment_id: 'p1' }]);
    const res = createMockResponse();

    await listPayments({} as Request, res);

    expect(res.json).toHaveBeenCalledWith([{ payment_id: 'p1' }]);
  });

  it('getPayment → 404 si no existe', async () => {
    mockedFindById.mockResolvedValue(null);

    const req = { 
      params: { id: 'no' }, 
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  // ============================================================================
  //                    createPayment (POST /api/payments)
  // ============================================================================
  it('createPayment → 400 si faltan campos obligatorios', async () => 
  {
    const req = { body: { customer_id: 'c1', amount: 100 } } as Request; // falta method
    const res = createMockResponse();

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createPayment → 201 si se crea', async () => 
  {
    const saved = { payment_id: 'p1' };
    mockedCreate.mockResolvedValue(saved);

    const req = {
      body: {
        customer_id: 'c1',
        amount: 100,
        currency: 'MXN',
        method: 'card',
        status: 'pending',
        external_ref: 'abc',
      },
    } as Request;
    const res = createMockResponse();

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('createPayment → 400 si CUSTOMER_NOT_FOUND', async () => {
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';
    mockedCreate.mockRejectedValue(error);

    const req = {
      body: {
        customer_id: 'no',
        amount: 100,
        method: 'card',
      },
    } as Request;
    const res = createMockResponse();

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ============================================================================
  //                   updatePayment (PUT /api/payments/:id)
  // ============================================================================
  it('updatePayment → 404 si no existe', async () => {
    mockedUpdate.mockResolvedValue(null);

    const req = {
      params: { id: 'no' },
      body: { amount: 200 },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updatePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updatePayment → 200 si actualiza', async () => {
    const updated = { payment_id: 'p1', amount: 200 };
    mockedUpdate.mockResolvedValue(updated);

    const req = {
      params: { id: 'p1' },
      body: { amount: 200 },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updatePayment(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  // ============================================================================
  //                  deletePayment (DELETE /api/payments/:id)
  // ============================================================================
  it('deletePayment → 204 si elimina', async () => {
    mockedDelete.mockResolvedValue(1);

    const req = { 
      params: { id: 'p1' }, 
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deletePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deletePayment → 404 si no existe', async () => {
    mockedDelete.mockResolvedValue(0);

    const req = { 
      params: { id: 'no' }, 
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deletePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});