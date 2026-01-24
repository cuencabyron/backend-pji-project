// Importa Express para montar una app mínima usada solo para pruebas de rutas.
import express from 'express';

// Importa supertest para hacer requests HTTP simulados contra la app Express en memoria.
import request from 'supertest';

// Mock del controller de Customer.
// Objetivo: probar el router (rutas + middlewares/validaciones) SIN ejecutar la lógica real del controller.
jest.mock('@/modules/customer/customer.controller', () => (
{
  // Mock de handler GET /api/customers
  listCustomers: jest.fn(),

  // Mock de handler GET /api/customers/:id
  getCustomer: jest.fn(),

  // Mock de handler POST /api/customers
  createCustomer: jest.fn(),

  // Mock de handler PUT /api/customers/:id
  updateCustomer: jest.fn(),

  // Mock de handler DELETE /api/customers/:id
  deleteCustomer: jest.fn(),
}));

// Importa el router real de customers.
// Este es el SUT (System Under Test): queremos verificar que enruta a los handlers correctos.
import customerRouter from '@/modules/customer/customer.routes';

// Importa el módulo del controller para poder acceder a las funciones mockeadas
// (ya que jest.mock lo reemplazó por jest.fn()).
import * as CustomerController from '@/modules/customer/customer.controller';

// Suite de pruebas para las rutas de Customer.
describe('Customer routes', () => 
{
  // Crea una app Express aislada para pruebas.
  const app = express();

  // Middleware para parsear JSON en body (necesario para POST/PUT).
  app.use(express.json());

  // Monta el router bajo el prefijo /api/customers.
  // Todas las rutas del router quedan accesibles como /api/customers/...
  app.use('/api/customers', customerRouter);

  // UUID válido de ejemplo para endpoints que requieren validación de UUID en :id.
  const validUuid = 'a3b658f6-6b97-4c90-9b8d-1c2f6904c4f9';

  // Limpia todos los mocks antes de cada test para no arrastrar llamadas anteriores.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  
  // ==============================================================================
  // Test: ruta GET /api/customers debe delegar a CustomerController.listCustomers.
  // ==============================================================================
  it('GET /api/customers debería llamar a listCustomers', async () => 
  {
    // Define una implementación del mock:
    // responde JSON [] para simular éxito.
    (CustomerController.listCustomers as jest.Mock).mockImplementation(
      (_req, res) => res.json([])
    );

    // Ejecuta la petición GET real contra la app.
    const res = await request(app).get('/api/customers');

    // Verifica que el handler se ejecutó una vez.
    expect(CustomerController.listCustomers).toHaveBeenCalledTimes(1);

    // Confirma que la respuesta HTTP fue 200 (por defecto res.json -> 200).
    expect(res.status).toBe(200);
  });


  // ===============================================================================
  // Test: ruta GET /api/customers/:id con UUID válido debe delegar a getCustomer.
  // ===============================================================================
  it('GET /api/customers/:id con UUID válido debería llamar a getCustomer', async () => 
  {
    // Mock: responde con el mismo id recibido en params.
    (CustomerController.getCustomer as jest.Mock).mockImplementation(
      (req, res) => res.json({ customer_id: req.params.id })
    );

    // Ejecuta GET con un UUID válido.
    const res = await request(app).get(`/api/customers/${validUuid}`);

    // Verifica que el handler se ejecutó.
    expect(CustomerController.getCustomer).toHaveBeenCalledTimes(1);

    // Debe responder 200.
    expect(res.status).toBe(200);

    // El body debe contener el customer_id igual al UUID enviado.
    expect(res.body.customer_id).toBe(validUuid);
  });


  // =========================================================================================
  // Test: GET /api/customers/:id con UUID inválido debe cortar antes de llegar al controller.
  // =========================================================================================
  // Esto prueba la validación del router (o middleware) que verifica el formato UUID.
  it('GET /api/customers/:id con UUID inválido debe responder 400 y NO llamar a getCustomer', async () => 
  {
    // Ejecuta GET con id inválido (no es UUID).
    const res = await request(app).get('/api/customers/123');

    // Verifica que NO se llamó el controller, porque la validación debió fallar antes.
    expect(CustomerController.getCustomer).not.toHaveBeenCalled();

    // Debe responder 400 Bad Request.
    expect(res.status).toBe(400);
  });


  // ==========================================================
  // Test: POST /api/customers debe delegar a createCustomer.
  // ==========================================================
  it('POST /api/customers debería llamar a createCustomer', async () => 
  {
    // Mock: simula creación exitosa devolviendo 201 y un objeto con customer_id generado.
    (CustomerController.createCustomer as jest.Mock).mockImplementation(
      (req, res) => res.status(201).json({ ...req.body, customer_id: validUuid })
    );

    // Payload de ejemplo para crear customer.
    const payload = {
      name: 'Test',
      email: 'test@example.com',
      phone: '5512345678',
      address: 'CDMX',
      active: true,
    };

    // Ejecuta POST con payload.
    const res = await request(app)
      .post('/api/customers')
      .send(payload);

    // Verifica que se llamó el controller.
    expect(CustomerController.createCustomer).toHaveBeenCalledTimes(1);

    // Verifica status 201.
    expect(res.status).toBe(201);

    // Verifica que se devolvió el UUID simulado.
    expect(res.body.customer_id).toBe(validUuid);
  });


  // =============================================================
  // Test: PUT /api/customers/:id debe delegar a updateCustomer.
  // =============================================================
  it('PUT /api/customers/:id debería llamar a updateCustomer', async () => 
  {
    // Mock: responde con customer_id del params y mezcla con body.
    (CustomerController.updateCustomer as jest.Mock).mockImplementation(
      (req, res) => res.json({ customer_id: req.params.id, ...req.body })
    );

    // Ejecuta PUT con un campo actualizado.
    const res = await request(app)
      .put(`/api/customers/${validUuid}`)
      .send({ name: 'Nuevo Nombre' });

    // Verifica que se llamó el controller.
    expect(CustomerController.updateCustomer).toHaveBeenCalledTimes(1);

    // Debe responder 200 (por defecto res.json).
    expect(res.status).toBe(200);

    // Verifica que el cambio se reflejó en la respuesta.
    expect(res.body.name).toBe('Nuevo Nombre');
  });


  // ============================================================================
  // Test: DELETE /api/customers/:id debe delegar a deleteCustomer.
  // ============================================================================
  it('DELETE /api/customers/:id debería llamar a deleteCustomer', async () => 
  {
    // Mock: simula eliminación correcta respondiendo 204 No Content.
    (CustomerController.deleteCustomer as jest.Mock).mockImplementation(
      (_req, res) => res.status(204).send()
    );

    // Ejecuta DELETE.
    const res = await request(app).delete(`/api/customers/${validUuid}`);

    // Verifica que se llamó el controller.
    expect(CustomerController.deleteCustomer).toHaveBeenCalledTimes(1);

    // Verifica status 204.
    expect(res.status).toBe(204);
  });
});