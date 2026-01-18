import request from 'supertest';
import app from '@/app';
import * as verificationService from '@/modules/verification/verification.service';

jest.mock('@/modules/verification/verification.service');

const serviceMock =
  verificationService as jest.Mocked<typeof verificationService>;

describe('VerificationController (HTTP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/verifications devuelve 200 y lista', async () => {
    serviceMock.findAllVerifications.mockResolvedValue([{} as any]);

    const res = await request(app).get('/api/verifications');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/verifications/:id devuelve 404 si no existe', async () => {
    serviceMock.findVerificationById.mockResolvedValue(null);

    const res = await request(app).get('/api/verifications/ver-no-existe');

    expect(res.status).toBe(404);
  });

  it('POST /api/verifications devuelve 201 cuando se crea', async () => {
    const dto = {
      customer_id: 'cust-1',
      session_id: 'sess-1',
      payment_id: 'pay-1',
      type: 'email',
      status: 'pending',
      attempts: 0,
    };
    const saved = { verification_id: 'ver-1', ...dto };

    serviceMock.createVerificationService.mockResolvedValue(saved as any);

    const res = await request(app).post('/api/verifications').send(dto);

    expect(res.status).toBe(201);
    expect(res.body.verification_id).toBe('ver-1');
    expect(serviceMock.createVerificationService).toHaveBeenCalledWith(dto);
  });

  it('POST /api/verifications devuelve 400 si customer_id no existe', async () => {
    const dto = {
      customer_id: 'cust-no-existe',
      session_id: 'sess-1',
      payment_id: 'pay-1',
      type: 'email',
      status: 'pending',
      attempts: 0,
    };

    const error: any = new Error('CUSTOMER_NOT_FOUND');
    error.code = 'CUSTOMER_NOT_FOUND';
    serviceMock.createVerificationService.mockRejectedValue(error);

    const res = await request(app).post('/api/verifications').send(dto);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/customer_id no existe/i);
  });
});