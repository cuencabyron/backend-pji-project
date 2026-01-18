import request from 'supertest';
import app from '@/app';
import * as sessionService from '@/modules/session/session.service';

jest.mock('@/modules/session/session.service');

const serviceMock = sessionService as jest.Mocked<typeof sessionService>;

describe('SessionController (HTTP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/sessions devuelve 200 y lista', async () => {
    serviceMock.findAllSessions.mockResolvedValue([{} as any]);

    const res = await request(app).get('/api/sessions');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/sessions/:id devuelve 404 si no existe', async () => {
    serviceMock.findSessionById.mockResolvedValue(null);

    const res = await request(app).get('/api/sessions/sess-no-existe');

    expect(res.status).toBe(404);
  });

  it('POST /api/sessions devuelve 201 cuando se crea', async () => {
    const dto = {
      customer_id: 'cust-1',
      user_agent: 'Mozilla/5.0',
      status: 'active',
    };
    const saved = { session_id: 'sess-1', ...dto };

    serviceMock.createSessionService.mockResolvedValue(saved as any);

    const res = await request(app).post('/api/sessions').send(dto);

    expect(res.status).toBe(201);
    expect(res.body.session_id).toBe('sess-1');
    expect(serviceMock.createSessionService).toHaveBeenCalledWith(dto);
  });

  it('POST /api/sessions devuelve 400 si customer_id no existe', async () => {
    const dto = {
      customer_id: 'cust-no-existe',
      user_agent: 'Mozilla/5.0',
      status: 'active',
    };

    const error: any = new Error('CUSTOMER_NOT_FOUND');
    error.code = 'CUSTOMER_NOT_FOUND';
    serviceMock.createSessionService.mockRejectedValue(error);

    const res = await request(app).post('/api/sessions').send(dto);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/customer_id no existe/i);
  });
});