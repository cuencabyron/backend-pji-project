import request from 'supertest';
import app from '@/app';
import * as productService from '@/modules/product/product.service';

jest.mock('@/modules/product/product.service');

const serviceMock = productService as jest.Mocked<typeof productService>;

describe('ProductController (HTTP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/products devuelve 200 y lista', async () => {
    serviceMock.findAllProducts.mockResolvedValue([{} as any]);

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/products/:id devuelve 404 si no existe', async () => {
    serviceMock.findProductById.mockResolvedValue(null);

    const res = await request(app).get('/api/products/prod-no-existe');

    expect(res.status).toBe(404);
  });

  it('POST /api/products devuelve 201 cuando se crea', async () => {
    const dto = {
      customer_id: 'cust-1',
      name: 'Plan Básico',
      description: 'Descripción del plan',
      min_monthly_rent: '100.00',
      max_monthly_rent: '300.00',
      active: true,
    };
    const saved = { product_id: 'prod-1', ...dto };

    serviceMock.createProductService.mockResolvedValue(saved as any);

    const res = await request(app).post('/api/products').send(dto);

    expect(res.status).toBe(201);
    expect(res.body.product_id).toBe('prod-1');
    expect(serviceMock.createProductService).toHaveBeenCalledWith(dto);
  });

  it('POST /api/products devuelve 400 si customer_id no existe', async () => {
    const dto = {
      customer_id: 'cust-no-existe',
      name: 'Plan Básico',
      description: 'Descripción del plan',
      min_monthly_rent: '100.00',
      max_monthly_rent: '300.00',
      active: true,
    };

    const error: any = new Error('CUSTOMER_NOT_FOUND');
    error.code = 'CUSTOMER_NOT_FOUND';
    serviceMock.createProductService.mockRejectedValue(error);

    const res = await request(app).post('/api/products').send(dto);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/customer_id no existe en la BD/i);
  });
});