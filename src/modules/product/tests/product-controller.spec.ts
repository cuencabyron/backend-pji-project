// src/modules/product/__tests__/product.controller.spec.ts
import type { Request, Response } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/modules/product/product.controller';

import {
  findAllProducts,
  findProductById,
  createProductService,
  updateProductService,
  deleteProductService,
} from '@/modules/product/product.service';

jest.mock('@/modules/product/product.service', () => ({
  findAllProducts: jest.fn(),
  findProductById: jest.fn(),
  createProductService: jest.fn(),
  updateProductService: jest.fn(),
  deleteProductService: jest.fn(),
}));

function createMockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('ProductController', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockedFindAll = findAllProducts as jest.Mock;
  const mockedFindById = findProductById as jest.Mock;
  const mockedCreate = createProductService as jest.Mock;
  const mockedUpdate = updateProductService as jest.Mock;
  const mockedDelete = deleteProductService as jest.Mock;

  // ============================================================================
  //                    listProducts (GET /api/products)
  // ============================================================================
  it('listProducts → 200', async () => 
  {
    mockedFindAll.mockResolvedValue([{ product_id: 'pr1' }]);
    const res = createMockResponse();

    await listProducts({} as Request, res);

    expect(res.json).toHaveBeenCalledWith([{ product_id: 'pr1' }]);
  });

  it('getProduct → 404 si no existe', async () => 
  {
    mockedFindById.mockResolvedValue(null);

    const req = { 
      params: { id: 'no' }, 
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  // ============================================================================
  //                    createProduct (POST /api/products)
  // ============================================================================
  it('createProduct → 400 si faltan campos obligatorios', async () => 
  {
    const req = {
      body: { customer_id: 'c1', name: 'Servicio X', description: '' }, 
    } as Request;
    const res = createMockResponse();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createProduct → 201 si se crea', async () => 
  {
    const saved = { product_id: 'pr1' };
    mockedCreate.mockResolvedValue(saved);

    const req = {
      body: {
        customer_id: 'c1',
        name: 'Servicio X',
        description: 'Desc',
        min_monthly_rent: 100,
        max_monthly_rent: 200,
        active: true,
      },
    } as Request;
    const res = createMockResponse();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('createProduct → 400 si CUSTOMER_NOT_FOUND', async () => 
  {
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';
    mockedCreate.mockRejectedValue(error);

    const req = {
      body: {
        customer_id: 'no',
        name: 'X',
        description: 'Y',
      },
    } as Request;
    const res = createMockResponse();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ============================================================================
  //                   updateProduct (PUT /api/products/:id)
  // ============================================================================
  it('updateProduct → 404 si no existe', async () => 
  {
    mockedUpdate.mockResolvedValue(null);

    const req = {
      params: { id: 'no' },
      body: { name: 'Nuevo' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updateProduct → 200 si actualiza', async () => 
  {
    const updated = { product_id: 'pr1', name: 'Nuevo' };
    mockedUpdate.mockResolvedValue(updated);

    const req = {
      params: { id: 'pr1' },
      body: { name: 'Nuevo' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateProduct(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  // ============================================================================
  //                  deleteProduct (DELETE /api/products/:id)
  // ============================================================================
  it('deleteProduct → 204 si elimina', async () => 
  {
    mockedDelete.mockResolvedValue(1);

    const req = { 
      params: { id: 'pr1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deleteProduct → 404 si no existe', async () => 
  {
    mockedDelete.mockResolvedValue(0);

    const req = { 
      params: { id: 'no' }, 
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});