// tests/routes/verification.routes.spec.ts
// Archivo de pruebas de rutas para el recurso Verification.
// Aquí se valida que el router:
// 1) Enruta correctamente cada endpoint al controller correspondiente
// 2) Aplica validación de UUID (cuando el router la tenga implementada)
// Nota: se mockea el controller para aislar la prueba del service/DB.

// Importa Express para montar una app mínima usada únicamente para pruebas del router.
import express from 'express';

// Importa supertest para ejecutar solicitudes HTTP simuladas contra la app en memoria.
import request from 'supertest';

// Mock del controller de Verification.
// Objetivo: probar el router (enrutamiento + validaciones) SIN ejecutar la lógica real del controller/service/DB.
jest.mock('@/modules/verification/verification.controller', () => ({
  // Mock del handler GET /api/verifications
  listVerifications: jest.fn(),

  // Mock del handler GET /api/verifications/:id
  getVerification: jest.fn(),

  // Mock del handler POST /api/verifications
  createVerification: jest.fn(),

  // Mock del handler PUT /api/verifications/:id
  updateVerification: jest.fn(),

  // Mock del handler DELETE /api/verifications/:id
  deleteVerification: jest.fn(),
}));

// Importa el router real de verifications (SUT: lo que se está probando).
import verificationRouter from '@/modules/verification/verification.routes';

// Importa el módulo del controller para acceder a las funciones mockeadas.
// Importante: jest.mock arriba reemplaza las funciones exportadas por jest.fn().
import * as VerificationController from '@/modules/verification/verification.controller';

// Suite de pruebas para las rutas del recurso Verification.
describe('Verification routes', () => {
  // Crea una app Express aislada para pruebas.
  const app = express();

  // Middleware para parsear JSON en body (necesario para POST/PUT).
  app.use(express.json());

  // Monta el router bajo el prefijo /api/verifications.
  app.use('/api/verifications', verificationRouter);

  // UUID válido de ejemplo para endpoints con validación de UUID en :id.
  const validUuid = 'd07e2b13-47e6-4de0-8e4e-7d3c0fd19f88';

  // Limpia todos los mocks antes de cada test para evitar contaminación entre casos.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  
  // ==============================================================
  // Test: GET /api/verifications debe delegar a listVerifications.
  // ==============================================================
  it('GET /api/verifications debería llamar a listVerifications', async () => 
  {
    // Define implementación del mock: responde con arreglo vacío.
    (VerificationController.listVerifications as jest.Mock).mockImplementation(
      (_req, res) => res.json([])
    );

    // Ejecuta request GET contra la app.
    const res = await request(app).get('/api/verifications');

    // Verifica que el handler fue invocado una vez.
    expect(VerificationController.listVerifications).toHaveBeenCalledTimes(1);

    // Verifica status 200 (res.json devuelve 200 por defecto).
    expect(res.status).toBe(200);
  });

  
  // =================================================================================
  // Test: GET /api/verifications/:id con UUID válido debe delegar a getVerification.
  // =================================================================================
  it('GET /api/verifications/:id con UUID válido debería llamar a getVerification', async () => 
  {
    // Mock: responde con verification_id igual al id recibido en params.
    (VerificationController.getVerification as jest.Mock).mockImplementation(
      (req, res) => res.json({ verification_id: req.params.id })
    );

    // Ejecuta GET con UUID válido.
    const res = await request(app).get(`/api/verifications/${validUuid}`);

    // Debe llamarse el handler una vez.
    expect(VerificationController.getVerification).toHaveBeenCalledTimes(1);

    // Debe responder 200.
    expect(res.status).toBe(200);

    // El body debe reflejar el id solicitado.
    expect(res.body.verification_id).toBe(validUuid);
  });

  
  // =================================================================================================
  // Test: GET /api/verifications/:id con UUID inválido debe responder 400 y no llamar al controller.
  // =================================================================================================
  // Esto prueba que el router/middleware valida el formato UUID del parámetro :id.
  it('GET /api/verifications/:id con UUID inválido debe responder 400', async () => 
  {
    // Ejecuta GET con id inválido.
    const res = await request(app).get('/api/verifications/123');

    // No debe llamarse el controller si la validación corta antes.
    expect(VerificationController.getVerification).not.toHaveBeenCalled();

    // Debe responder 400 Bad Request.
    expect(res.status).toBe(400);
  });

  
  // =================================================================
  // Test: POST /api/verifications debe delegar a createVerification.
  // =================================================================
  it('POST /api/verifications debería llamar a createVerification', async () => 
  {
    // Mock: simula creación exitosa (201) y devuelve verification_id + body.
    (VerificationController.createVerification as jest.Mock).mockImplementation(
      (req, res) => res.status(201).json({ verification_id: validUuid, ...req.body })
    );

    // Payload de ejemplo para crear una verificación.
    const payload = {
      customer_id: validUuid,  // en un caso real serían UUIDs distintos; aquí sirve para probar el flujo.
      session_id: validUuid,   // idem.
      payment_id: validUuid,   // idem.
      type: 'email',           // tipo de verificación.
      status: 'pending',       // estado inicial.
      attempts: 0,             // intentos (nota: tu API podría requerir >= 1; aquí es prueba de router).
    };

    // Ejecuta POST con payload.
    const res = await request(app)
      .post('/api/verifications')
      .send(payload);

    // Debe llamarse el handler una vez.
    expect(VerificationController.createVerification).toHaveBeenCalledTimes(1);

    // Debe responder 201 Created.
    expect(res.status).toBe(201);

    // Debe devolver verification_id simulado.
    expect(res.body.verification_id).toBe(validUuid);
  });

  
  // =====================================================================
  // Test: PUT /api/verifications/:id debe delegar a updateVerification.
  // =====================================================================
  it('PUT /api/verifications/:id debería llamar a updateVerification', async () => 
  {
    // Mock: responde con verification_id del params y mezcla con body.
    (VerificationController.updateVerification as jest.Mock).mockImplementation(
      (req, res) =>
        res.json({ verification_id: req.params.id, ...req.body })
    );

    // Ejecuta PUT para actualizar status e attempts.
    const res = await request(app)
      .put(`/api/verifications/${validUuid}`)
      .send({ status: 'approved', attempts: 1 });

    // Debe llamarse el handler una vez.
    expect(VerificationController.updateVerification).toHaveBeenCalledTimes(1);

    // Debe responder 200.
    expect(res.status).toBe(200);

    // El body debe reflejar el cambio.
    expect(res.body.status).toBe('approved');
  });

  
  // =======================================================================
  // Test: DELETE /api/verifications/:id debe delegar a deleteVerification.
  // =======================================================================
  it('DELETE /api/verifications/:id debería llamar a deleteVerification', async () => 
  {
    // Mock: simula eliminación exitosa con 204 No Content.
    (VerificationController.deleteVerification as jest.Mock).mockImplementation(
      (_req, res) => res.status(204).send()
    );

    // Ejecuta DELETE.
    const res = await request(app).delete(`/api/verifications/${validUuid}`);

    // Debe llamarse el handler una vez.
    expect(VerificationController.deleteVerification).toHaveBeenCalledTimes(1);

    // Debe responder 204.
    expect(res.status).toBe(204);
  });
});