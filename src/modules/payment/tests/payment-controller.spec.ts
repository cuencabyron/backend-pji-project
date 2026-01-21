import { Request, Response } from 'express';
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

jest.mock('@/modules/payment/payment.service', () => (
{
  findAllPayments: jest.fn(),
  findPaymentById: jest.fn(),
  createPaymentService: jest.fn(),
  updatePaymentService: jest.fn(),
  deletePaymentService: jest.fn(),
}));

function createMockResponse(): Response  
{
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('PaymentController', () => 
{
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFindAllPayments = findAllPayments as jest.Mock;
  const mockFindPaymentById = findPaymentById as jest.Mock;
  const mockCreatePaymentService = createPaymentService as jest.Mock;
  const mockUpdatePaymentService = updatePaymentService as jest.Mock;
  const mockDeletePaymentService = deletePaymentService as jest.Mock;

  // =========================================================
  //           listPayments (GET /api/payments)
  // =========================================================
  it('listPayments → 200 y devuelve arreglo de payments', async () => 
  {
    const fakePayments = [
      {
        payment_id: 'pay-1',
        customer_id: 'cust-1',
        amount: '100.00',
        currency: 'MXN',
        method: 'card',
        status: 'paid',
        external_ref: 'ABC123',
      },
    ];

    mockFindAllPayments.mockResolvedValue(fakePayments);

    const req = {} as Request;
    const res = createMockResponse();

    await listPayments(req, res);

    expect(mockFindAllPayments).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(fakePayments);
  });

  it('listPayments → 500 si el servicio lanza error', async () => 
  {
    mockFindAllPayments.mockRejectedValue(new Error('DB error'));
    const req = {} as Request;
    const res = createMockResponse();

    await listPayments(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error listando payments',
    });
  });

  // ============================================================================
  //                    getPayment (GET /api/payments/:id)
  // ============================================================================
  it('getPayment → 200 si encuentra el payment', async () => 
  {
    const fakePayment = {
      payment_id: 'pay-1',
      customer_id: 'cust-1',
      amount: '100.00',
      currency: 'MXN',
      method: 'card',
      status: 'paid',
      external_ref: 'ABC123',
    };

    mockFindPaymentById.mockResolvedValue(fakePayment);

    const req = {
      params: { id: 'pay-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getPayment(req, res);

    expect(mockFindPaymentById).toHaveBeenCalledWith('pay-1');
    expect(res.json).toHaveBeenCalledWith(fakePayment);
  });

  it('getPayment → 404 si no existe', async () => 
  {
    mockFindPaymentById.mockResolvedValue(null);

    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Payment no encontrado',
    });
  });

  it('getPayment → 500 si el servicio lanza error', async () => 
  {
    mockFindPaymentById.mockRejectedValue(new Error('Fallo raro'));

    const req = {
      params: { id: 'pay-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error obteniendo payment',
    });
  });

  // ============================================================================
  //                    createPayment (POST /api/payments)
  // ============================================================================
  it('createPayment → 201 cuando se crea correctamente', async () => 
  {
    const body = {
      customer_id: 'cust-1',
      amount: '100.00',
      currency: 'MXN',
      method: 'card',
      status: 'paid',
      external_ref: 'ABC123',
    };

    const saved = {
      payment_id: 'pay-1',
      ...body,
    };

    mockCreatePaymentService.mockResolvedValue(saved);

    const req = { body } as Request;
    const res = createMockResponse();

    await createPayment(req, res);

    expect(mockCreatePaymentService).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('createPayment → 400 si faltan campos obligatorios', async () => 
  {
    const req = {
      body: {
        customer_id: 'cust-1',
        // falta amount y method
      },
    } as Request;
    const res = createMockResponse();

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id, amount y method son requeridos',
    });
    expect(mockCreatePaymentService).not.toHaveBeenCalled();
  });

  it('createPayment → 400 si CUSTOMER_NOT_FOUND', async () => 
  {
    const body = {
      customer_id: 'cust-no',
      amount: '100.00',
      currency: 'MXN',
      method: 'card',
      status: 'pending',
      external_ref: 'ABC123',
    };

    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';

    mockCreatePaymentService.mockRejectedValue(error);

    const req = { body } as Request;
    const res = createMockResponse();

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe en la BD',
    });
  });

  it('createPayment → 500 en error inesperado', async () => {
    const body = {
      customer_id: 'cust-1',
      amount: '100.00',
      currency: 'MXN',
      method: 'card',
      status: 'pending',
      external_ref: 'ABC123',
    };

    mockCreatePaymentService.mockRejectedValue(new Error('Error inesperado'));

    const req = { body } as Request;
    const res = createMockResponse();

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error creando payment',
    });
  });

  // =========================================================
  //         updatePayment (PUT /api/payments/:id)
  // =========================================================
  it('updatePayment → 200 cuando se actualiza correctamente', async () => 
  {
    const body = {
      customer_id: 'cust-1',
      amount: '150.00',
      currency: 'USD',
      method: 'card',
      status: 'paid',
      external_ref: 'XYZ999',
    };

    const updated = {
      payment_id: 'pay-1',
      ...body,
    };

    mockUpdatePaymentService.mockResolvedValue(updated);

    const req = {
      params: { id: 'pay-1' },
      body,
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updatePayment(req, res);

    expect(mockUpdatePaymentService).toHaveBeenCalledWith('pay-1', body);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('updatePayment → 404 si no existe', async () => 
  {
    mockUpdatePaymentService.mockResolvedValue(null);

    const req = {
      params: { id: 'no-existe' },
      body: {},
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updatePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'payment no encontrado',
    });
  });

  it('updatePayment → 400 si CUSTOMER_NOT_FOUND', async () => 
  {
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';

    mockUpdatePaymentService.mockRejectedValue(error);

    const req = {
      params: { id: 'pay-1' },
      body: { customer_id: 'cust-no' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updatePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe en la BD',
    });
  });

  it('updatePayment → 500 en error inesperado', async () => 
  {
    mockUpdatePaymentService.mockRejectedValue(new Error('Fallo raro'));

    const req = {
      params: { id: 'pay-1' },
      body: {},
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updatePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error actualizando payment',
    });
  });

  // =========================================================
  //         deletePayment (DELETE /api/payments/:id)
  // =========================================================
  it('deletePayment → 204 cuando se elimina correctamente', async () => 
  {
    mockDeletePaymentService.mockResolvedValue(1);

    const req = {
      params: { id: 'pay-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deletePayment(req, res);

    expect(mockDeletePaymentService).toHaveBeenCalledWith('pay-1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deletePayment → 404 si no se elimina nada', async () => 
  {
    mockDeletePaymentService.mockResolvedValue(0);

    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deletePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Payment no encontrado',
    });
  });

  it('deletePayment → 500 en error inesperado', async () => 
  {
    mockDeletePaymentService.mockRejectedValue(new Error('Error delete'));

    const req = {
      params: { id: 'pay-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deletePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error eliminando payment',
    });
  });
});