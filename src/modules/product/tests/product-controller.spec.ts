import { Request, Response } from 'express';
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

jest.mock('@/modules/product/product.service', () => (
{
  findAllProducts: jest.fn(),
  findProductById: jest.fn(),
  createProductService: jest.fn(),
  updateProductService: jest.fn(),
  deleteProductService: jest.fn(),
}));

function createMockResponse(): Response  
{
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('ProductController', () => 
{
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFindAllProducts = findAllProducts as jest.Mock;
  const mockFindProductById = findProductById as jest.Mock;
  const mockCreateProductService = createProductService as jest.Mock;
  const mockUpdateProductService = updateProductService as jest.Mock;
  const mockDeleteProductService = deleteProductService as jest.Mock;

  // =========================================================
  //           listProducts (GET /api/products)
  // =========================================================
  it('GET listProducts → 200 y devuelve el arreglo de products', async () => 
  {
    const fakeProducts = [
      {
        product_id: 'prod-1',
        customer_id: 'cust-1',
        name: 'Landing Page',
        description: 'Sitio corporativo',
        min_monthly_rent: '100.00',
        max_monthly_rent: '300.00',
        active: true,
      },
    ];

    mockFindAllProducts.mockResolvedValue(fakeProducts);
    const res = createMockResponse();
    await listProducts({} as Request, res);

    expect(mockFindAllProducts).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(fakeProducts);
    expect(res.status).not.toHaveBeenCalledWith(500);
  });

  it('GET listProducts → 500 si el servicio lanza error', async () => 
  {
    mockFindAllProducts.mockRejectedValue(new Error('DB Error'));

    const req = {} as Request;
    const res = createMockResponse();

    await listProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error listando products',
    });
  });

  // =========================================================
  //           getProduct (GET /api/products/:id)
  // =========================================================
  it('GET getProduct → 200 y devuelve el product si existe', async () => 
  {
    const fakeProduct = {
      product_id: 'prod-1',
      customer_id: 'cust-1',
      name: 'Landing Page',
      description: 'Sitio corporativo',
      min_monthly_rent: '100.00',
      max_monthly_rent: '300.00',
      active: true,
    };

    mockFindProductById.mockResolvedValue(fakeProduct);

    const req = {
      params: { id: 'prod-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getProduct(req, res);

    expect(mockFindProductById).toHaveBeenCalledWith('prod-1');
    expect(res.json).toHaveBeenCalledWith(fakeProduct);
  });

  it('GET getProduct → 404 si el product no existe', async () => 
  {
    mockFindProductById.mockResolvedValue(null);

    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Product no encontrado',
    });
  });

  it('GET getProduct → 500 si el servicio lanza error', async () => 
  {
    mockFindProductById.mockRejectedValue(new Error('Error raro'));

    const req = {
      params: { id: 'prod-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error obteniendo product',
    });
  });

  // =========================================================
  //           createProduct (POST /api/products)
  // =========================================================
  it('POST createProduct → 201 cuando se crea correctamente', async () => 
  {
    const body = {
      customer_id: 'cust-1',
      name: 'Landing Page',
      description: 'Sitio corporativo',
      min_monthly_rent: '100.00',
      max_monthly_rent: '300.00',
      active: true,
    };

    const saved = {
      product_id: 'prod-1',
      ...body,
    };

    mockCreateProductService.mockResolvedValue(saved);

    const req = {
      body,
    } as Request;
    const res = createMockResponse();

    await createProduct(req, res);

    expect(mockCreateProductService).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('POST createProduct → 400 si faltan campos obligatorios', async () => 
  {
    // Falta name y description
    const req = {
      body: {
        customer_id: 'cust-1',
      },
    } as Request;
    const res = createMockResponse();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id, name y description son requeridos',
    });
    expect(mockCreateProductService).not.toHaveBeenCalled();
  });

  it('POST createProduct → 400 si el servicio lanza CUSTOMER_NOT_FOUND', async () => 
  {
    const body = {
      customer_id: 'cust-no-existe',
      name: 'Landing Page',
      description: 'Sitio corporativo',
      min_monthly_rent: '100.00',
      max_monthly_rent: '300.00',
      active: true,
    };

    const error: any = new Error('customer_id no existe');
    error.code = 'CUSTOMER_NOT_FOUND';

    mockCreateProductService.mockRejectedValue(error);

    const req = { body } as Request;
    const res = createMockResponse();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe en la BD',
    });
  });

  it('POST createProduct → 500 si el servicio lanza otro error', async () => 
  {
    const body = {
      customer_id: 'cust-1',
      name: 'Landing Page',
      description: 'Sitio corporativo',
      min_monthly_rent: '100.00',
      max_monthly_rent: '300.00',
      active: true,
    };

    mockCreateProductService.mockRejectedValue(new Error('Error inesperado'));

    const req = { body } as Request;
    const res = createMockResponse();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error creando product',
    });
  });

  // =========================================================
  //       updateProduct (PUT /api/products/:id)
  // =========================================================
  it('PUT updateProduct → 200 cuando se actualiza correctamente', async () => 
  {
    const body = {
      customer_id: 'cust-1',
      name: 'Nuevo nombre',
      description: 'Nueva desc',
      min_monthly_rent: '150.00',
      max_monthly_rent: '350.00',
      active: false,
    };

    const updated = {
      product_id: 'prod-1',
      ...body,
    };

    mockUpdateProductService.mockResolvedValue(updated);

    const req = {
      params: { id: 'prod-1' },
      body,
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateProduct(req, res);

    expect(mockUpdateProductService).toHaveBeenCalledWith('prod-1', body);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('PUT updateProduct → 404 si el product no existe', async () => 
  {
    mockUpdateProductService.mockResolvedValue(null);

    const req = {
      params: { id: 'no-existe' },
      body: {
        name: 'X',
        description: 'Y',
      },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Product no encontrado',
    });
  });

  it('PUT updateProduct → 400 si el servicio lanza CUSTOMER_NOT_FOUND', async () => 
  {
    const error: any = new Error('customer_id no existe');
    error.code = 'CUSTOMER_NOT_FOUND';

    mockUpdateProductService.mockRejectedValue(error);

    const req = {
      params: { id: 'prod-1' },
      body: {
        customer_id: 'cust-no-existe',
        name: 'X',
        description: 'Y',
      },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe en la BD',
    });
  });

  it('PUT updateProduct → 500 si el servicio lanza otro error', async () => 
  {
    mockUpdateProductService.mockRejectedValue(new Error('Fallo raro'));

    const req = {
      params: { id: 'prod-1' },
      body: {
        name: 'X',
        description: 'Y',
      },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error actualizando product',
    });
  });

  // =========================================================
  //         deleteProduct (DELETE /api/products/:id)
  // =========================================================
  it('DELETE deleteProduct → 204 cuando se elimina correctamente', async () => 
  {
    mockDeleteProductService.mockResolvedValue(1); // 1 fila borrada

    const req = {
      params: { id: 'prod-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteProduct(req, res);

    expect(mockDeleteProductService).toHaveBeenCalledWith('prod-1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('DELETE deleteProduct → 404 si no se borró ninguna fila', async () => 
  {
    mockDeleteProductService.mockResolvedValue(0);

    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Product no encontrado',
    });
  });

  it('DELETE deleteProduct → 500 si el servicio lanza error', async () => 
  {
    mockDeleteProductService.mockRejectedValue(new Error('Error delete'));

    const req = {
      params: { id: 'prod-1' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error eliminando product',
    });
  });
});