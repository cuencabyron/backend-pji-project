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

    const res = await request(app).get('/api/payments/pay-no-existe');

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/no encontrado/i);
  });

  it('POST /api/payments devuelve 201 cuando se crea', async () => {
    const dto = {
      customer_id: 'cust-1',
      amount: 100,
      currency: 'MXN',
      method: 'card',
      status: 'pending',
      external_ref: 'REF-1',
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
      customer_id: 'cust-no-existe',
      amount: 100,
      currency: 'MXN',
      method: 'card',
      status: 'pending',
      external_ref: 'REF-1',
    };

    const error: any = new Error('CUSTOMER_NOT_FOUND');
    error.code = 'CUSTOMER_NOT_FOUND';
    serviceMock.createPaymentService.mockRejectedValue(error);

    const res = await request(app).post('/api/payments').send(dto);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no existe en la BD/i);
  });
});