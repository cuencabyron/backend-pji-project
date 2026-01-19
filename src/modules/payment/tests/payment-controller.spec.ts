import request from 'supertest';
import app from '@/app';
import * as paymentService from '@/modules/payment/payment.service';

jest.mock('@/modules/payment/payment.service');

const serviceMock = paymentService as jest.Mocked<typeof paymentService>;

describe('PaymentController (HTTP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/payments devuelve 200 y lista de payments', async () => {
    serviceMock.findAllPayments.mockResolvedValue([{} as any]);

    const res = await request(app).get('/api/payments');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(serviceMock.findAllPayments).toHaveBeenCalledTimes(1);
  });

  it('GET /api/payments/:id devuelve 404 cuando no existe', async () => {
    serviceMock.findPaymentById.mockResolvedValue(null);

    const res = await request(app).get('/api/payments/0c8722c1-edc2-485f-9f7c-686025c4306f');

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/no encontrado/i);
  });

  it('POST /api/payments devuelve 201 cuando se crea', async () => {
    const dto = {
      customer_id: 'ebe310f8-41fe-4b78-bf22-7279bd8e7f7b',
      amount: 9950,
      currency: 'MXN',
      method: 'card',
      status: 'paid',
      external_ref: 'PAY-001-TPV',
    };
    const saved = { payment_id: 'pay-1', ...dto };

    serviceMock.createPaymentService.mockResolvedValue(saved as any);

    const res = await request(app).post('/api/payments').send(dto);

    expect(res.status).toBe(201);
    expect(res.body.payment_id).toBe('pay-1');
    expect(serviceMock.createPaymentService).toHaveBeenCalledWith(dto);
  });

  it('POST /api/payments devuelve 400 si el customer no existe', async () => {
    const dto = {
      customer_id: '7c8b3989-2585-4c60-a0uc-8fabd58jae4b',
      amount: 4950,
      currency: 'MXN',
      method: 'oxxo',
      status: 'paid',
      external_ref: 'OXXO-234234',
    };

    const error: any = new Error('CUSTOMER_NOT_FOUND');
    error.code = 'CUSTOMER_NOT_FOUND';
    serviceMock.createPaymentService.mockRejectedValue(error);

    const res = await request(app).post('/api/payments').send(dto);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no existe en la BD/i);
  });
});