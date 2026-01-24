// Importa Express para montar una app mínima usada únicamente para pruebas del router.
import express from 'express';

// Importa supertest para ejecutar solicitudes HTTP simuladas contra la app en memoria.
import request from 'supertest';

// Mock del controller de Product.
// Objetivo: probar el router (enrutamiento + validaciones) SIN ejecutar la lógica real del controller/service/DB.
jest.mock('@/modules/product/product.controller', () => ({
  // Mock del handler GET /api/products
  listProducts: jest.fn(),

  // Mock del handler GET /api/products/:id
  getProduct: jest.fn(),

  // Mock del handler POST /api/products
  createProduct: jest.fn(),

  // Mock del handler PUT /api/products/:id
  updateProduct: jest.fn(),

  // Mock del handler DELETE /api/products/:id
  deleteProduct: jest.fn(),
}));

// Importa el router real de products (SUT: lo que se está probando).
import productRouter from '@/modules/product/product.routes';

// Importa el módulo del controller para acceder a las funciones mockeadas
// (jest.mock ya las sustituyó por jest.fn()).
import * as ProductController from '@/modules/product/product.controller';

// Suite de pruebas para las rutas del recurso Product.
describe('Product routes', () => {
  // Crea una app Express aislada para pruebas.
  const app = express();

  // Middleware para parsear JSON en body (necesario para POST/PUT).
  app.use(express.json());

  // Monta el router bajo el prefijo /api/products.
  app.use('/api/products', productRouter);

  // UUID válido de ejemplo para endpoints con validación de UUID en :id.
  const validUuid = 'e6e34a01-ae5c-4d13-8c0a-d635b3d9eab2';

  // Limpia todos los mocks antes de cada test para evitar contaminación entre casos.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  
  // =====================================================
  // Test: GET /api/products debe delegar a listProducts.
  // =====================================================
  it('GET /api/products debería llamar a listProducts', async () => 
  {
    // Define implementación del mock: responde con arreglo vacío.
    (ProductController.listProducts as jest.Mock).mockImplementation(
      (_req, res) => res.json([])
    );

    // Ejecuta request GET contra la app.
    const res = await request(app).get('/api/products');

    // Verifica que el handler fue invocado una vez.
    expect(ProductController.listProducts).toHaveBeenCalledTimes(1);

    // Verifica status 200 (res.json devuelve 200 por defecto).
    expect(res.status).toBe(200);
  });

  
  // ======================================================================
  // Test: GET /api/products/:id con UUID válido debe delegar a getProduct.
  // ======================================================================
  it('GET /api/products/:id con UUID válido debería llamar a getProduct', async () => 
  {
    // Mock: responde con product_id igual al id recibido en params.
    (ProductController.getProduct as jest.Mock).mockImplementation(
      (req, res) => res.json({ product_id: req.params.id })
    );

    // Ejecuta GET con UUID válido.
    const res = await request(app).get(`/api/products/${validUuid}`);

    // Debe llamarse el handler una vez.
    expect(ProductController.getProduct).toHaveBeenCalledTimes(1);

    // Debe responder 200.
    expect(res.status).toBe(200);

    // El body debe reflejar el id solicitado.
    expect(res.body.product_id).toBe(validUuid);
  });

  
  // ============================================================================================
  // Test: GET /api/products/:id con UUID inválido debe responder 400 y no llamar al controller.
  // ============================================================================================
  // Esto prueba que el router/middleware valida el formato UUID del parámetro :id.
  it('GET /api/products/:id con UUID inválido debe responder 400', async () => 
  {
    // Ejecuta GET con id inválido.
    const res = await request(app).get('/api/products/123');

    // No debe llamarse el controller si la validación corta antes.
    expect(ProductController.getProduct).not.toHaveBeenCalled();

    // Debe responder 400 Bad Request.
    expect(res.status).toBe(400);
  });

  
  // =======================================================
  // Test: POST /api/products debe delegar a createProduct.
  // =======================================================
  it('POST /api/products debería llamar a createProduct', async () => 
  {
    // Mock: simula creación exitosa (201) y devuelve product_id + body.
    (ProductController.createProduct as jest.Mock).mockImplementation(
      (req, res) => res.status(201).json({ product_id: validUuid, ...req.body })
    );

    // Payload de ejemplo para crear un producto.
    const payload = {
      customer_id: validUuid,
      name: 'Product test',
      description: 'Desc',
      min_monthly_rent: 100,
      max_monthly_rent: 200,
      active: true,
    };

    // Ejecuta POST con payload.
    const res = await request(app)
      .post('/api/products')
      .send(payload);

    // Debe llamarse el handler una vez.
    expect(ProductController.createProduct).toHaveBeenCalledTimes(1);

    // Debe responder 201 Created.
    expect(res.status).toBe(201);

    // Debe devolver el product_id simulado.
    expect(res.body.product_id).toBe(validUuid);
  });

  
  // =========================================================
  // Test: PUT /api/products/:id debe delegar a updateProduct.
  // =========================================================
  it('PUT /api/products/:id debería llamar a updateProduct', async () => 
  {
    // Mock: responde con product_id del params y mezcla con body.
    (ProductController.updateProduct as jest.Mock).mockImplementation(
      (req, res) => res.json({ product_id: req.params.id, ...req.body })
    );

    // Ejecuta PUT para actualizar el nombre.
    const res = await request(app)
      .put(`/api/products/${validUuid}`)
      .send({ name: 'Nuevo nombre' });

    // Debe llamarse el handler una vez.
    expect(ProductController.updateProduct).toHaveBeenCalledTimes(1);

    // Debe responder 200.
    expect(res.status).toBe(200);

    // Debe reflejar el nombre actualizado.
    expect(res.body.name).toBe('Nuevo nombre');
  });

  
  // =============================================================
  // Test: DELETE /api/products/:id debe delegar a deleteProduct.
  // =============================================================
  it('DELETE /api/products/:id debería llamar a deleteProduct', async () => 
  {
    // Mock: simula eliminación exitosa con 204 No Content.
    (ProductController.deleteProduct as jest.Mock).mockImplementation(
      (_req, res) => res.status(204).send()
    );

    // Ejecuta DELETE.
    const res = await request(app).delete(`/api/products/${validUuid}`);

    // Debe llamarse el handler una vez.
    expect(ProductController.deleteProduct).toHaveBeenCalledTimes(1);

    // Debe responder 204.
    expect(res.status).toBe(204);
  });
});