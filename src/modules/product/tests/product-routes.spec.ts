import express from 'express';
import request from 'supertest';

jest.mock('@/modules/product/product.controller', () => ({
  listProducts: jest.fn(),
  getProduct: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
}));

import productRouter from '@/modules/product/product.routes';
import * as ProductController from '@/modules/product/product.controller';

describe('Product routes', () => {

  const app = express();

  app.use(express.json());
  app.use('/api/products', productRouter);

  const validUuid = 'a3b658f6-6b97-4c90-9b8d-1c2f6904c4f9';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ======================================================
  // GET /api/products
  // ======================================================

  it('GET /api/products debería llamar a listProducts', async () => 
  {

    (ProductController.listProducts as jest.Mock).mockImplementation(
      (_req, res) => res.json([])
    );

    const res = await request(app).get('/api/products');

    expect(ProductController.listProducts).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);

  });

  // ======================================================
  // GET /api/products/:id
  // ======================================================

  it('GET /api/products/:id debería llamar a getProduct', async () => 
  {

    (ProductController.getProduct as jest.Mock).mockImplementation(
      (req, res) => res.json({ product_id: req.params.id })
    );

    const res = await request(app).get(`/api/products/${validUuid}`);

    expect(ProductController.getProduct).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body.product_id).toBe(validUuid);

  });

  it('GET /api/products/:id con UUID inválido debe responder 400', async () => 
  {

    const res = await request(app).get('/api/products/123');

    expect(ProductController.getProduct).not.toHaveBeenCalled();
    expect(res.status).toBe(400);

  });

  // ======================================================
  // POST /api/products
  // ======================================================

  it('POST /api/products debería llamar a createProduct', async () => 
  {

    (ProductController.createProduct as jest.Mock).mockImplementation(
      (req, res) => res.status(201).json({ product_id: validUuid, ...req.body })
    );

    const payload = {
      name: 'Plan básico',
      description: 'Cobertura básica',
      min_monthly_rent: '1000.000',
      max_monthly_rent: '3000.000',
      active: true,
    };

    const res = await request(app)
      .post('/api/products')
      .send(payload);

    expect(ProductController.createProduct).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(201);
    expect(res.body.product_id).toBe(validUuid);

  });

  // ======================================================
  // PUT /api/products/:id
  // ======================================================

  it('PUT /api/products/:id debería llamar a updateProduct', async () => 
  {

    (ProductController.updateProduct as jest.Mock).mockImplementation(
      (req, res) => res.json({ product_id: req.params.id, ...req.body })
    );

    const res = await request(app)
      .put(`/api/products/${validUuid}`)
      .send({ name: 'Nuevo plan' });

    expect(ProductController.updateProduct).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Nuevo plan');

  });

  // ======================================================
  // DELETE /api/products/:id
  // ======================================================

  it('DELETE /api/products/:id debería llamar a deleteProduct', async () => 
  {

    (ProductController.deleteProduct as jest.Mock).mockImplementation(
      (_req, res) => res.status(204).send()
    );

    const res = await request(app).delete(`/api/products/${validUuid}`);

    expect(ProductController.deleteProduct).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(204);

  });

});