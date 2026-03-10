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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFindAll = findAllProducts as jest.Mock;
  const mockFindById = findProductById as jest.Mock;
  const mockCreate = createProductService as jest.Mock;
  const mockUpdate = updateProductService as jest.Mock;
  const mockDelete = deleteProductService as jest.Mock;

  // ======================================================
  // listProducts
  // ======================================================

  it('listProducts → devuelve productos', async () => 
  {
    const fake = [{ product_id: '1', name: 'Plan básico' }];

    mockFindAll.mockResolvedValue(fake);

    const res = createMockResponse();

    await listProducts({} as Request, res);

    expect(mockFindAll).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(fake);

  });

  it('listProducts → 500 si falla el service', async () => 
  {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockFindAll.mockRejectedValue(new Error());

    const res = createMockResponse();

    await listProducts({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error listando products',
    });

  });

  // ======================================================
  // getProduct
  // ======================================================

  it('getProduct → devuelve producto si existe', async () => 
  {
    const fake = { product_id: '1', name: 'Plan básico' };

    mockFindById.mockResolvedValue(fake);

    const req = { params: { id: '1' } } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getProduct(req, res);

    expect(mockFindById).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith(fake);

  });

  it('getProduct → 404 si no existe', async () => 
  {
    mockFindById.mockResolvedValue(null);

    const req = { params: { id: '10' } } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);

  });

  // ======================================================
  // createProduct
  // ======================================================

  it('createProduct → 400 si faltan campos', async () => 
  {
    const req = {
      body: { name: 'Plan básico' },
    } as Request;

    const res = createMockResponse();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockCreate).not.toHaveBeenCalled();

  });

  it('createProduct → 201 cuando se crea', async () => 
  {
    const body = {
      name: 'Plan básico',
      description: 'Cobertura básica',
      min_monthly_rent: '1000.000',
      max_monthly_rent: '3000.000',
      active: true,
    };

    const saved = { product_id: '1', ...body };

    mockCreate.mockResolvedValue(saved);

    const req = { body } as Request;
    const res = createMockResponse();

    await createProduct(req, res);

    expect(mockCreate).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);

  });

  // ======================================================
  // updateProduct
  // ======================================================

  it('updateProduct → actualiza correctamente', async () => 
  {
    const updated = { product_id: '1', name: 'Nuevo plan' };

    mockUpdate.mockResolvedValue(updated);

    const req = {
      params: { id: '1' },
      body: { name: 'Nuevo plan' },
    } as unknown as Request<{ id: string }>;

    const res = createMockResponse();

    await updateProduct(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);

  });

  it('updateProduct → 404 si no existe', async () => 
  {
    mockUpdate.mockResolvedValue(null);

    const req = {
      params: { id: '10' },
      body: {},
    } as unknown as Request<{ id: string }>;

    const res = createMockResponse();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);

  });

  // ======================================================
  // deleteProduct
  // ======================================================

  it('deleteProduct → 204 si elimina', async () => 
  {

    mockDelete.mockResolvedValue(1);

    const req = { params: { id: '1' } } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteProduct(req, res);

    expect(mockDelete).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(204);

  });

  it('deleteProduct → 404 si no existe', async () => 
  {
    mockDelete.mockResolvedValue(0);

    const req = { params: { id: '10' } } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});