// Importa Express para montar una app mínima usada solo para pruebas de rutas.
import express from 'express';

// Importa supertest para ejecutar requests HTTP simulados contra la app en memoria.
import request from 'supertest';

// Mock del controller de Session.
// Objetivo: probar el router (enrutamiento + validaciones) sin ejecutar la lógica real del controller/service/DB.
jest.mock('@/modules/session/session.controller', () => ({
  // Mock del handler GET /api/sessions
  listSessions: jest.fn(),

  // Mock del handler GET /api/sessions/:id
  getSession: jest.fn(),

  // Mock del handler POST /api/sessions
  createSession: jest.fn(),

  // Mock del handler PUT /api/sessions/:id
  updateSession: jest.fn(),

  // Mock del handler DELETE /api/sessions/:id
  deleteSession: jest.fn(),
}));

// Importa el router real de sessions (SUT: lo que se está probando).
import sessionRouter from '@/modules/session/session.routes';

// Importa el módulo del controller para acceder a las funciones mockeadas
// (jest.mock ya las sustituyó por jest.fn()).
import * as SessionController from '@/modules/session/session.controller';

// Suite de pruebas para las rutas del recurso Session.
describe('Session routes', () => {
  // Crea una app Express aislada para pruebas.
  const app = express();

  // Middleware para parsear JSON del body (necesario para POST/PUT).
  app.use(express.json());

  // Monta el router bajo el prefijo /api/sessions.
  app.use('/api/sessions', sessionRouter);

  // UUID válido de ejemplo para pruebas de endpoints con validación de UUID en :id.
  const validUuid = 'c1fdea0e-07af-4f71-8b78-4c8c70815b77';

  // Limpia todos los mocks antes de cada test para evitar contaminación entre casos.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  
  // =====================================================
  // Test: GET /api/sessions debe delegar a listSessions.
  // =====================================================
  it('GET /api/sessions debería llamar a listSessions', async () => 
  {
    // Define implementación del mock: responde con lista vacía.
    (SessionController.listSessions as jest.Mock).mockImplementation(
      (_req, res) => res.json([])
    );

    // Ejecuta request GET contra la app.
    const res = await request(app).get('/api/sessions');

    // Verifica que el handler fue invocado.
    expect(SessionController.listSessions).toHaveBeenCalledTimes(1);

    // Verifica status 200 (res.json responde 200 por defecto).
    expect(res.status).toBe(200);
  });


  // ======================================================================
  // Test: GET /api/sessions/:id con UUID válido debe delegar a getSession.
  // ======================================================================
  it('GET /api/sessions/:id con UUID válido debería llamar a getSession', async () => 
  {
    // Mock: responde con session_id igual al param recibido.
    (SessionController.getSession as jest.Mock).mockImplementation(
      (req, res) => res.json({ session_id: req.params.id })
    );

    // Ejecuta GET con UUID válido.
    const res = await request(app).get(`/api/sessions/${validUuid}`);

    // Debe llamarse el handler una vez.
    expect(SessionController.getSession).toHaveBeenCalledTimes(1);

    // Debe responder 200.
    expect(res.status).toBe(200);

    // El body debe reflejar el id enviado.
    expect(res.body.session_id).toBe(validUuid);
  });

  
  // ============================================================================================
  // Test: GET /api/sessions/:id con UUID inválido debe responder 400 y no llamar al controller.
  // ============================================================================================
  // Esto valida que el router/middleware está validando el formato UUID del parámetro :id.
  it('GET /api/sessions/:id con UUID inválido debe responder 400', async () => 
  {
    // Ejecuta GET con id inválido (no UUID).
    const res = await request(app).get('/api/sessions/123');

    // No debe llamarse el controller si la validación del router falla antes.
    expect(SessionController.getSession).not.toHaveBeenCalled();

    // Debe responder 400 Bad Request.
    expect(res.status).toBe(400);
  });

  
  // ========================================================
  // Test: POST /api/sessions debe delegar a createSession.
  // ========================================================
  it('POST /api/sessions debería llamar a createSession', async () => 
  {
    // Mock: simula creación exitosa (201) y devuelve session_id + body.
    (SessionController.createSession as jest.Mock).mockImplementation(
      (req, res) =>
        res
          .status(201)
          .json({ session_id: validUuid, ...req.body })
    );

    // Payload de ejemplo para crear una session.
    const payload = {
      customer_id: validUuid,
      user_agent: 'Mozilla/5.0',
      status: 'active',
    };

    // Ejecuta POST con payload.
    const res = await request(app)
      .post('/api/sessions')
      .send(payload);

    // Debe llamarse el handler una vez.
    expect(SessionController.createSession).toHaveBeenCalledTimes(1);

    // Debe responder 201 Created.
    expect(res.status).toBe(201);

    // Debe devolver el session_id simulado.
    expect(res.body.session_id).toBe(validUuid);
  });

  
  // ==========================================================
  // Test: PUT /api/sessions/:id debe delegar a updateSession.
  // ==========================================================
  it('PUT /api/sessions/:id debería llamar a updateSession', async () => 
  {
    // Mock: responde con session_id del params y mezcla con body.
    (SessionController.updateSession as jest.Mock).mockImplementation(
      (req, res) => res.json({ session_id: req.params.id, ...req.body })
    );

    // Ejecuta PUT para actualizar el status.
    const res = await request(app)
      .put(`/api/sessions/${validUuid}`)
      .send({ status: 'ended' });

    // Debe llamarse el handler una vez.
    expect(SessionController.updateSession).toHaveBeenCalledTimes(1);

    // Debe responder 200.
    expect(res.status).toBe(200);

    // El body debe reflejar el cambio de status.
    expect(res.body.status).toBe('ended');
  });

  
  // =============================================================
  // Test: DELETE /api/sessions/:id debe delegar a deleteSession.
  // =============================================================
  it('DELETE /api/sessions/:id debería llamar a deleteSession', async () => 
  {
    // Mock: simula eliminación correcta con 204 No Content.
    (SessionController.deleteSession as jest.Mock).mockImplementation(
      (_req, res) => res.status(204).send()
    );

    // Ejecuta DELETE.
    const res = await request(app).delete(`/api/sessions/${validUuid}`);

    // Debe llamarse el handler una vez.
    expect(SessionController.deleteSession).toHaveBeenCalledTimes(1);

    // Debe responder 204.
    expect(res.status).toBe(204);
  });
});