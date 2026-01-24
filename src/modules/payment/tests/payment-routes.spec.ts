// Importa Express para montar una app mínima usada solo para pruebas de rutas.
import express from 'express';

// Importa supertest para ejecutar requests HTTP simulados contra la app en memoria.
import request from 'supertest';

// Mock del controller de Payment.
// Objetivo: probar el router (enrutamiento + validaciones) SIN ejecutar lógica real del controller/service/DB.
jest.mock('@/modules/payment/payment.controller', () => ({
  // Mock del handler GET /api/payments
  listPayments: jest.fn(),

  // Mock del handler GET /api/payments/:id
  getPayment: jest.fn(),

  // Mock del handler POST /api/payments
  createPayment: jest.fn(),

  // Mock del handler PUT /api/payments/:id
  updatePayment: jest.fn(),

  // Mock del handler DELETE /api/payments/:id
  deletePayment: jest.fn(),
}));

// Importa el router real de payments: es lo que se está probando (SUT).
import paymentRouter from '@/modules/payment/payment.routes';

// Importa el módulo del controller para acceder a las funciones mockeadas
// (jest.mock ya las sustituyó por jest.fn()).
import * as PaymentController from '@/modules/payment/payment.controller';

// Suite de pruebas para las rutas del recurso Payment.
describe('Payment routes', () => {
  // Crea una app Express aislada para tests.
  const app = express();

  // Middleware para parsear JSON en el body (necesario para POST/PUT).
  app.use(express.json());

  // Monta el router bajo el prefijo /api/payments.
  app.use('/api/payments', paymentRouter);

  // UUID válido de ejemplo (para endpoints con validación de UUID).
  const validUuid = 'b4c2f160-1456-4aa0-9090-2a3b5cbf3e11';

  // Limpia mocks antes de cada test para evitar contaminación de estado.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  
  // =====================================================
  // Test: GET /api/payments debe delegar a listPayments.
  // =====================================================
  it('GET /api/payments debería llamar a listPayments', async () => 
  {
    // Define una implementación del mock: responde con JSON vacío.
    (PaymentController.listPayments as jest.Mock).mockImplementation(
      (_req, res) => res.json([])
    );

    // Ejecuta request GET contra la app.
    const res = await request(app).get('/api/payments');

    // Verifica que el controller fue llamado una vez.
    expect(PaymentController.listPayments).toHaveBeenCalledTimes(1);

    // Verifica status 200 (res.json devuelve 200 por defecto).
    expect(res.status).toBe(200);
  });

  
  // ======================================================================
  // Test: GET /api/payments/:id con UUID válido debe delegar a getPayment.
  // ======================================================================
  it('GET /api/payments/:id con UUID válido debería llamar a getPayment', async () => 
  {
    // Mock: devuelve payment_id igual al id recibido por params.
    (PaymentController.getPayment as jest.Mock).mockImplementation(
      (req, res) => res.json({ payment_id: req.params.id })
    );

    // Ejecuta request GET con UUID válido.
    const res = await request(app).get(`/api/payments/${validUuid}`);

    // Debe llamar al handler una vez.
    expect(PaymentController.getPayment).toHaveBeenCalledTimes(1);

    // Debe responder 200.
    expect(res.status).toBe(200);

    // El body debe reflejar el id solicitado.
    expect(res.body.payment_id).toBe(validUuid);
  });

  
  // ===========================================================================================
  // Test: GET /api/payments/:id con UUID inválido debe responder 400 y no llamar al controller.
  // ===========================================================================================
  // Esto prueba la validación de params del router (middleware/validator).
  it('GET /api/payments/:id con UUID inválido debe responder 400', async () => 
  {
    // Ejecuta GET con id inválido (no UUID).
    const res = await request(app).get('/api/payments/123');

    // No debe llamarse el controller porque el router rechaza antes.
    expect(PaymentController.getPayment).not.toHaveBeenCalled();

    // Debe responder 400 Bad Request.
    expect(res.status).toBe(400);
  });

  
  // =======================================================
  // Test: POST /api/payments debe delegar a createPayment.
  // =======================================================
  it('POST /api/payments debería llamar a createPayment', async () => 
  {
    // Mock: simula creación exitosa (201) y devuelve payment_id + body.
    (PaymentController.createPayment as jest.Mock).mockImplementation(
      (req, res) => res.status(201).json({ payment_id: validUuid, ...req.body })
    );

    // Payload de ejemplo para creación.
    const payload = {
      customer_id: validUuid,
      amount: 100.5,
      currency: 'MXN',
      method: 'card',
      status: 'pending',
      external_ref: 'REF-123',
    };

    // Ejecuta POST con payload.
    const res = await request(app)
      .post('/api/payments')
      .send(payload);

    // Debe llamarse el handler una vez.
    expect(PaymentController.createPayment).toHaveBeenCalledTimes(1);

    // Debe responder 201 Created.
    expect(res.status).toBe(201);

    // Debe devolver el payment_id simulado.
    expect(res.body.payment_id).toBe(validUuid);
  });

  
  // ==========================================================
  // Test: PUT /api/payments/:id debe delegar a updatePayment.
  // ==========================================================
  it('PUT /api/payments/:id debería llamar a updatePayment', async () => 
  {
    // Mock: responde con payment_id del params y mezcla con body.
    (PaymentController.updatePayment as jest.Mock).mockImplementation(
      (req, res) => res.json({ payment_id: req.params.id, ...req.body })
    );

    // Ejecuta PUT para cambiar status.
    const res = await request(app)
      .put(`/api/payments/${validUuid}`)
      .send({ status: 'paid' });

    // Debe llamar al handler una vez.
    expect(PaymentController.updatePayment).toHaveBeenCalledTimes(1);

    // Debe responder 200.
    expect(res.status).toBe(200);

    // El body debe reflejar el status actualizado.
    expect(res.body.status).toBe('paid');
  });

  
  // ============================================================
  // Test: DELETE /api/payments/:id debe delegar a deletePayment.
  // ============================================================
  it('DELETE /api/payments/:id debería llamar a deletePayment', async () => 
  {
    // Mock: simula eliminación correcta con 204 No Content.
    (PaymentController.deletePayment as jest.Mock).mockImplementation(
      (_req, res) => res.status(204).send()
    );

    // Ejecuta DELETE.
    const res = await request(app).delete(`/api/payments/${validUuid}`);

    // Debe llamar al handler una vez.
    expect(PaymentController.deletePayment).toHaveBeenCalledTimes(1);

    // Debe responder 204.
    expect(res.status).toBe(204);
  });
});