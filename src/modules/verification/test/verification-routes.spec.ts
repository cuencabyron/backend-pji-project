import express from 'express';
import request from 'supertest';

jest.mock('@/modules/verification/verification.controller', () => ({
  listVerifications: jest.fn(),
  getVerification: jest.fn(),
  createVerification: jest.fn(),
  updateVerification: jest.fn(),
  deleteVerification: jest.fn(),
}));

import verificationRouter from '@/modules/verification/verification.routes';

import * as VerificationController from '@/modules/verification/verification.controller';

describe('Verification routes', () => {

  const app = express();

  app.use(express.json());
  app.use('/api/verifications', verificationRouter);

  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================
  // GET /api/verifications
  // =====================================================

  it('GET /api/verifications debería llamar a listVerifications', async () => 
  {
    (VerificationController.listVerifications as jest.Mock).mockImplementation(
      (_req, res) => res.json([])
    );

    const res = await request(app).get('/api/verifications');

    expect(VerificationController.listVerifications).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);

  });

  // =====================================================
  // GET /api/verifications/:id
  // =====================================================

  it('GET /api/verifications/:id con UUID válido debería llamar a getVerification', async () => 
  {
    (VerificationController.getVerification as jest.Mock).mockImplementation(
      (req, res) => res.json({ verification_id: req.params.id })
    );

    const res = await request(app).get(`/api/verifications/${validUuid}`);

    expect(VerificationController.getVerification).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body.verification_id).toBe(validUuid);

  });

  it('GET /api/verifications/:id con UUID inválido debe responder 400', async () => 
  {
    const res = await request(app).get('/api/verifications/123');

    expect(VerificationController.getVerification).not.toHaveBeenCalled();
    expect(res.status).toBe(400);

  });

  // =====================================================
  // POST /api/verifications
  // =====================================================

  it('POST /api/verifications debería llamar a createVerification', async () => 
  {
    (VerificationController.createVerification as jest.Mock).mockImplementation(
      (req, res) => res.status(201).json({ verification_id: validUuid, ...req.body })
    );

    const payload = {
      customer_id: validUuid,
      session_id: validUuid,
      payment_id: validUuid,
      type: 'identity',
      attempts: 1,
      status: 'pending',
    };

    const res = await request(app)
      .post('/api/verifications')
      .send(payload);

    expect(VerificationController.createVerification).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(201);
    expect(res.body.verification_id).toBe(validUuid);

  });

  // =====================================================
  // PUT /api/verifications/:id
  // =====================================================

  it('PUT /api/verifications/:id debería llamar a updateVerification', async () => 
  {
    (VerificationController.updateVerification as jest.Mock).mockImplementation(
      (req, res) => res.json({ verification_id: req.params.id, ...req.body })
    );

    const res = await request(app)
      .put(`/api/verifications/${validUuid}`)
      .send({ status: 'approved' });

    expect(VerificationController.updateVerification).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');

  });

  // =====================================================
  // DELETE /api/verifications/:id
  // =====================================================

  it('DELETE /api/verifications/:id debería llamar a deleteVerification', async () => 
  {
    (VerificationController.deleteVerification as jest.Mock).mockImplementation(
      (_req, res) => res.status(204).send()
    );

    const res = await request(app).delete(`/api/verifications/${validUuid}`);

    expect(VerificationController.deleteVerification).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(204);
  });
});