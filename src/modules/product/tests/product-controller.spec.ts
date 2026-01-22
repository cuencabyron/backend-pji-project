// Importa Request y Response de Express para tipar correctamente los objetos simulados (mocks) en los tests.
import { Request, Response } from 'express';

// Importa los controllers (handlers) que se van a probar.
// Cada uno representa una operación CRUD del recurso Product.
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/modules/product/product.controller';

// Importa las funciones del service.
// Se importan para poder:
// 1) Mockear el módulo completo con jest.mock
// 2) Castearlas a jest.Mock y controlar su comportamiento por test
import {
  findAllProducts,
  findProductById,
  createProductService,
  updateProductService,
  deleteProductService,
} from '@/modules/product/product.service';

// Mock del módulo product.service.
// Sustituye las implementaciones reales por jest.fn() para aislar el controller de DB/ORM.
jest.mock('@/modules/product/product.service', () => (
{
  // Mock: listar todos los productos.
  findAllProducts: jest.fn(),

  // Mock: buscar un producto por ID.
  findProductById: jest.fn(),

  // Mock: crear un producto.
  createProductService: jest.fn(),

  // Mock: actualizar un producto.
  updateProductService: jest.fn(),

  // Mock: eliminar un producto.
  deleteProductService: jest.fn(),
}));

// Crea un Response falso de Express para inspeccionar llamadas a status/json/send.
// Permite chaining típico: res.status(201).json(...)
function createMockResponse(): Response  
{
  // Se usa Partial<Response> para crear un objeto incompleto al que se le agregan solo los métodos necesarios.
  const res: Partial<Response> = {};

  // Mock de res.status: registra llamadas y devuelve res para permitir encadenamiento.
  res.status = jest.fn().mockReturnValue(res);

  // Mock de res.json: registra llamadas y devuelve res para permitir encadenamiento.
  res.json = jest.fn().mockReturnValue(res);

  // Mock de res.send: registra llamadas y devuelve res para permitir encadenamiento.
  res.send = jest.fn().mockReturnValue(res);

  // Casteo a Response para cumplir el tipo esperado por los controllers.
  return res as Response;
}

// Agrupa todas las pruebas unitarias del ProductController.
describe('ProductController', () => 
{
  // Se ejecuta antes de cada test para resetear el estado de los mocks.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Aliases tipados a jest.Mock para usar mockResolvedValue/mockRejectedValue.
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
    // Lista simulada de productos que devolvería el service.
    const fakeProducts = [
      {
        // ID simulado del producto.
        product_id: 'prod-1',

        // ID de customer asociado (según tu modelo; ojo: a veces product no depende de customer).
        customer_id: 'cust-1',

        // Nombre del producto.
        name: 'Landing Page',

        // Descripción del producto.
        description: 'Sitio corporativo',

        // Renta mínima mensual (en este test es string).
        min_monthly_rent: '100.00',

        // Renta máxima mensual (en este test es string).
        max_monthly_rent: '300.00',

        // Indica si el producto está activo.
        active: true,
      },
    ];

    // Configura el service para resolver con la lista simulada.
    mockFindAllProducts.mockResolvedValue(fakeProducts);

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller con un Request vacío (no usa params/body aquí).
    await listProducts({} as Request, res);

    // Verifica que el service se llamó una vez.
    expect(mockFindAllProducts).toHaveBeenCalledTimes(1);

    // Verifica que devolvió el arreglo en JSON.
    expect(res.json).toHaveBeenCalledWith(fakeProducts);

    // Asegura que NO se haya respondido con 500 en el flujo exitoso.
    // (Esta aserción es redundante pero válida como “guardrail”).
    expect(res.status).not.toHaveBeenCalledWith(500);
  });

  it('GET listProducts → 500 si el servicio lanza error', async () => 
  {
    // Spy a console.error para suprimir logs durante la prueba.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Configura el service para fallar (simula error DB).
    mockFindAllProducts.mockRejectedValue(new Error('DB Error'));

    // Request vacío.
    const req = {} as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await listProducts(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Debe responder con mensaje de error controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error listando products',
    });

    // Restaura console.error original.
    consoleSpy.mockRestore();
  });

  // =========================================================
  //           getProduct (GET /api/products/:id)
  // =========================================================
  it('GET getProduct → 200 y devuelve el product si existe', async () => 
  {
    // Producto simulado (caso encontrado).
    const fakeProduct = {
      product_id: 'prod-1',
      customer_id: 'cust-1',
      name: 'Landing Page',
      description: 'Sitio corporativo',
      min_monthly_rent: '100.00',
      max_monthly_rent: '300.00',
      active: true,
    };

    // Configura el service para devolver el producto.
    mockFindProductById.mockResolvedValue(fakeProduct);

    // Request con params.id.
    const req = {
      params: { id: 'prod-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getProduct(req, res);

    // Verifica que el controller llamó al service con el ID correcto.
    expect(mockFindProductById).toHaveBeenCalledWith('prod-1');

    // Verifica que devolvió el producto.
    expect(res.json).toHaveBeenCalledWith(fakeProduct);
  });

  it('GET getProduct → 404 si el product no existe', async () => 
  {
    // Service devuelve null para simular "no encontrado".
    mockFindProductById.mockResolvedValue(null);

    // Request con id inexistente.
    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getProduct(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Debe devolver mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Product no encontrado',
    });
  });

  it('GET getProduct → 500 si el servicio lanza error', async () => 
  {
    // Spy para suprimir logs.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Service falla con error genérico.
    mockFindProductById.mockRejectedValue(new Error('Error raro'));

    // Request con id.
    const req = {
      params: { id: 'prod-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getProduct(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error obteniendo product',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  // =========================================================
  //           createProduct (POST /api/products)
  // =========================================================
  it('POST createProduct → 201 cuando se crea correctamente', async () => 
  {
    // Body válido para creación.
    const body = {
      customer_id: 'cust-1',
      name: 'Esencial',
      description: 'Cobertura enfocada en la recuperación del inmueble',

      // En este test min/max son number (difiere de otros tests donde son string).
      min_monthly_rent: 3500,
      max_monthly_rent: 4949,

      active: true,
    };

    // Objeto simulado ya guardado con id asignado.
    const saved = {
      product_id: 'prod-1',
      ...body,
    };

    // Configura el service para devolver el objeto creado.
    mockCreateProductService.mockResolvedValue(saved);

    // Request con body.
    const req = { body } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createProduct(req, res);

    // Verifica que se llamó al service con el body.
    expect(mockCreateProductService).toHaveBeenCalledWith(body);

    // Verifica status 201.
    expect(res.status).toHaveBeenCalledWith(201);

    // Verifica que devolvió el creado.
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('POST createProduct → 400 si faltan campos obligatorios', async () => 
  {
    // Request con body incompleto: falta name (comentado).
    const req = {
      body: {
        customer_id: 'cust-1',

        // Campo requerido faltante para probar validación en controller.
        //name: 'Esencial',

        description: 'Cobertura enfocada en la recuperación del inmueble',
      },
    } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createProduct(req, res);

    // Debe responder 400 por validación.
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje de validación.
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id, name y description son requeridos',
    });

    // El service no debe llamarse si el controller detecta body inválido.
    expect(mockCreateProductService).not.toHaveBeenCalled();
  });

  it('POST createProduct → 400 si el servicio lanza CUSTOMER_NOT_FOUND', async () => 
  {
    // Body con customer_id inexistente.
    const body = {
      customer_id: 'cust-no-existe',
      name: 'Landing Page',
      description: 'Sitio corporativo',
      min_monthly_rent: 3500,
      max_monthly_rent: 4949,
      active: true,
    };

    // Error tipificado por el service cuando el customer no existe.
    const error: any = new Error('customer_id no existe');
    error.code = 'CUSTOMER_NOT_FOUND';

    // Configura el service para rechazar con el error.
    mockCreateProductService.mockRejectedValue(error);

    // Request con body.
    const req = { body } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createProduct(req, res);

    // Controller mapea CUSTOMER_NOT_FOUND a 400.
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje específico.
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe en la BD',
    });
  });

  it('POST createProduct → 500 si el servicio lanza otro error', async () => 
  {
    // Spy para suprimir logs.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Body de ejemplo (aquí min/max vuelven a ser string).
    const body = {
      customer_id: 'cust-1',
      name: 'Landing Page',
      description: 'Sitio corporativo',
      min_monthly_rent: '100.00',
      max_monthly_rent: '300.00',
      active: true,
    };

    // Error genérico inesperado del service.
    mockCreateProductService.mockRejectedValue(new Error('Error inesperado'));

    // Request con body.
    const req = { body } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createProduct(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error creando product',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  // =========================================================
  //       updateProduct (PUT /api/products/:id)
  // =========================================================
  it('PUT updateProduct → 200 cuando se actualiza correctamente', async () => 
  {
    // Body válido para actualización.
    const body = {
      customer_id: 'cust-1',
      name: 'Nuevo nombre',
      description: 'Nueva desc',
      min_monthly_rent: '150.00',
      max_monthly_rent: '350.00',
      active: false,
    };

    // Objeto simulado actualizado.
    const updated = {
      product_id: 'prod-1',
      ...body,
    };

    // Service devuelve el actualizado.
    mockUpdateProductService.mockResolvedValue(updated);

    // Request con params.id y body.
    const req = {
      params: { id: 'prod-1' },
      body,
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateProduct(req, res);

    // Verifica llamada al service con id y body.
    expect(mockUpdateProductService).toHaveBeenCalledWith('prod-1', body);

    // Verifica que devolvió el actualizado.
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('PUT updateProduct → 404 si el product no existe', async () => 
  {
    // Service devuelve null (no encontrado).
    mockUpdateProductService.mockResolvedValue(null);

    // Request con id inexistente.
    const req = {
      params: { id: 'no-existe' },
      body: {
        name: 'X',
        description: 'Y',
      },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateProduct(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Product no encontrado',
    });
  });

  it('PUT updateProduct → 400 si el servicio lanza CUSTOMER_NOT_FOUND', async () => 
  {
    // Error tipificado: customer_id inválido.
    const error: any = new Error('customer_id no existe');
    error.code = 'CUSTOMER_NOT_FOUND';

    // Service rechaza con error tipificado.
    mockUpdateProductService.mockRejectedValue(error);

    // Request intentando actualizar con customer_id inexistente.
    const req = {
      params: { id: 'prod-1' },
      body: {
        customer_id: 'cust-no-existe',
        name: 'X',
        description: 'Y',
      },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateProduct(req, res);

    // Mapea a 400 (entrada inválida por relación).
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje específico.
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe en la BD',
    });
  });

  it('PUT updateProduct → 500 si el servicio lanza otro error', async () => 
  {
    // Spy para suprimir logs.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Error genérico inesperado.
    mockUpdateProductService.mockRejectedValue(new Error('Fallo raro'));

    // Request de actualización mínima.
    const req = {
      params: { id: 'prod-1' },
      body: {
        name: 'X',
        description: 'Y',
      },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateProduct(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error actualizando product',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  // =========================================================
  //         deleteProduct (DELETE /api/products/:id)
  // =========================================================
  it('DELETE deleteProduct → 204 cuando se elimina correctamente', async () => 
  {
    // Service devuelve 1 para indicar que se borró una fila (eliminación exitosa).
    mockDeleteProductService.mockResolvedValue(1); // 1 fila borrada

    // Request con id a eliminar.
    const req = {
      params: { id: 'prod-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deleteProduct(req, res);

    // Verifica llamada con id correcto.
    expect(mockDeleteProductService).toHaveBeenCalledWith('prod-1');

    // Debe responder 204 No Content.
    expect(res.status).toHaveBeenCalledWith(204);

    // Debe finalizar respuesta sin body.
    expect(res.send).toHaveBeenCalled();
  });

  it('DELETE deleteProduct → 404 si no se borró ninguna fila', async () => 
  {
    // Service devuelve 0: no existía el producto.
    mockDeleteProductService.mockResolvedValue(0);

    // Request con id inexistente.
    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deleteProduct(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Product no encontrado',
    });
  });

  it('DELETE deleteProduct → 500 si el servicio lanza error', async () => 
  {
    // Spy para suprimir logs.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Service rechaza con error genérico.
    mockDeleteProductService.mockRejectedValue(new Error('Error delete'));

    // Request con id válido.
    const req = {
      params: { id: 'prod-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deleteProduct(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error eliminando product',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });
});