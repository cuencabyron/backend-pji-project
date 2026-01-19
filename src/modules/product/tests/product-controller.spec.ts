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

    const res = await request(app).get('/api/products/4956c3a6-7f88-47b6-99de-870b700f7aab');

    expect(res.status).toBe(404);
  });

  it('POST /api/products devuelve 201 cuando se crea', async () => {
    const dto = {
      customer_id: '583e2f58-e0b6-4fd2-adb1-c6b948fe32ad',
      name: 'Premium',
      description: 'Incluye todos los beneficios de Esencial',
      min_monthly_rent: 4950,
      max_monthly_rent: 9949,
      active: true,
    };
    const saved = { product_id: '4956c3a6-7f88-47b6-99de-870b700f7aab', ...dto };

    serviceMock.createProductService.mockResolvedValue(saved as any);

    const res = await request(app).post('/api/products').send(dto);

    expect(res.status).toBe(201);
    expect(res.body.product_id).toBe('4956c3a6-7f88-47b6-99de-870b700f7aab');
    expect(serviceMock.createProductService).toHaveBeenCalledWith(dto);
  });

  it('POST /api/products devuelve 400 si customer_id no existe', async () => {
    const dto = {
      customer_id: '583e2f58-e0b6-4fd2-adb1-c6b948fe32ad',
      name: 'Premium',
      description: 'Incluye todos los beneficios de Esencial',
      min_monthly_rent: 4950,
      max_monthly_rent: 9949,
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