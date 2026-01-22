import type { Request, Response } from 'express';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/modules/customer/customer.controller';

import {
  findAllCustomers,
  findCustomerById,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
} from '@/modules/customer/customer.service';

jest.mock('@/modules/customer/customer.service', () => (
{
  findAllCustomers: jest.fn(),
  findCustomerById: jest.fn(),
  createCustomerService: jest.fn(),
  updateCustomerService: jest.fn(),
  deleteCustomerService: jest.fn(),
}));

function createMockResponse(): Response 
{
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('CustomerController', () => 
{
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockedFindAll = findAllCustomers as jest.Mock;
  const mockedFindById = findCustomerById as jest.Mock;
  const mockedCreate = createCustomerService as jest.Mock;
  const mockedUpdate = updateCustomerService as jest.Mock;
  const mockedDelete = deleteCustomerService as jest.Mock;

  // ============================================================================
  //                    listCustomers (GET /api/customers)
  // ============================================================================
  it('GET listCustomers → 200 con arreglo de customers', async () => 
  {
    const fakeCustomers = [
      { 
        customer_id: 'cust-1', 
        name: 'Byron Cuenca' 
      },
    ];

    mockedFindAll.mockResolvedValue(fakeCustomers);
    const res = createMockResponse();
    await listCustomers({} as Request, res);

    expect(mockedFindAll).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(fakeCustomers);
  });

  it('GET listCustomers → 500 si el servicio lanza error', async () => 
  {
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    mockedFindAll.mockRejectedValue(new Error('DB error'));

    const res = createMockResponse();
    await listCustomers({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({message: 'Error listando customers',});

    consoleSpy.mockRestore();
  });

  // ============================================================================
  //                    getCustomer (GET /api/customers/:id)
  // ============================================================================
  it('GET getCustomer → 200 si existe', async () => 
  {
    const fakeCustomer = 
    { 
      customer_id: 'cust-2', 
      name: 'Rafael Puente' 
    };
    mockedFindById.mockResolvedValue(fakeCustomer);

    const req = { 
      params: { id: 'cust-2' }, 
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getCustomer(req, res);

    expect(mockedFindById).toHaveBeenCalledWith('cust-2');
    expect(res.json).toHaveBeenCalledWith(fakeCustomer);
  });

  it('GET getCustomer → 404 si no existe', async () => 
  {
    mockedFindById.mockResolvedValue(null);

    const req = { 
      params: { id: 'cust-10' }, 
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await getCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({message: 'Customer no encontrado',});
  });

  // ============================================================================
  //                    createCustomer (POST /api/customers)
  // ============================================================================
  it('POST createCustomer → 400 si faltan campos obligatorios', async () => 
  {
    const req = {
      body: { 
        name: 'Maria Solis', 
        email: 'marsolis.167@yahoo.com', 
        //phone: '7774690016', 
        address:'Linares, Nuevo León' ,
      }, 
    } as Request<{ id: string }>;
    const res = createMockResponse();

    await createCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'name, email, phone, address son requeridos',
    });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('POST createCustomer → 201 si se crea correctamente', async () => 
  {
    const reqBody = {
      name: 'Maria Solis',
      email: 'marsolis.167@yahoo.com',
      phone: '7774690016',
      address: 'Linares, Nuevo León',
      active: true,
    };
    const saved = { customer_id: '', ...reqBody };

    mockedCreate.mockResolvedValue(saved);

    const req = { body: reqBody } as Request;
    const res = createMockResponse();

    await createCustomer(req, res);

    expect(mockedCreate).toHaveBeenCalledWith(reqBody);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('POST createCustomer → 409 si el email ya está en uso (EMAIL_IN_USE)', async () => 
  {
    const error: any = new Error('EMAIL_IN_USE');
    error.code = 'EMAIL_IN_USE';
    mockedCreate.mockRejectedValue(error);

    const req = {
      body: {
        name: 'Luis Chavez',
        email: 'marsolis.167@yahoo.com',
        phone: '7351980026',
        address: 'Cuautla, Morelos',
        active: true,
      },
    } as Request;
    const res = createMockResponse();

    await createCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({message: 'El email ya está en uso por otro customer',});
  });

  // ============================================================================
  //                   updateCustomer (PUT /api/customers/:id)
  // ============================================================================
  it('PUT updateCustomer → 200 si actualiza correctamente', async () => 
  {
    const updated = { customer_id: 'cust-2', name: 'Noah Sebastian' };
    mockedUpdate.mockResolvedValue(updated);

    const req = {
      params: { id: 'cust-2' },
      body: { name: 'Noah Sebastian' },
    } as unknown as Request<{ id: string }>;;
    const res = createMockResponse();

    await updateCustomer(req, res);

    expect(mockedUpdate).toHaveBeenCalledWith('cust-2', {
      name: 'Noah Sebastian',
      email: undefined,
      phone: undefined,
      address: undefined,
      active: undefined,
    });
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('PUT updateCustomer → 404 si el customer no existe', async () => 
  {
    mockedUpdate.mockResolvedValue(null);

    const req = {
      params: { id: 'cust-10' },
      body: { name: 'Andres Gómez' },
    } as unknown as Request<{ id: string }>;;
    const res = createMockResponse();

    await updateCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Customer no encontrado',
    });
  });

  it('PUT updateCustomer → 409 si email ya está en uso', async () => 
  {
    const error: any = new Error('EMAIL_IN_USE');
    error.code = 'EMAIL_IN_USE';
    mockedUpdate.mockRejectedValue(error);

    const req = {
      params: { id: 'cust-10' },
      body: { email: 'marsolis.167@yahoo.com' },
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await updateCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'El email ya está en uso por otro customer',
    });
  });

  // ============================================================================
  //                  deleteCustomer (DELETE /api/customers/:id)
  // ============================================================================
  it('DELETE deleteCustomer → 204 si elimina correctamente', async () => 
  {
    mockedDelete.mockResolvedValue(1); 

    const req = { 
      params: { id: 'cust-1' },
     } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteCustomer(req, res);

    expect(mockedDelete).toHaveBeenCalledWith('cust-1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('DELETE deleteCustomer → 404 si no existe', async () => 
  {
    mockedDelete.mockResolvedValue(0);

    const req = { 
      params: { id: 'cust-10' },
     } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Customer no encontrado',
    });
  });

  it('DELETE deleteCustomer → 409 si tiene pagos activos', async () => 
  {
    const error: any = new Error('CUSTOMER_HAS_ACTIVE_PAYMENTS');
    error.code = 'CUSTOMER_HAS_ACTIVE_PAYMENTS';
    mockedDelete.mockRejectedValue(error);

    const req = { 
      params: { id: 'cust-1' }, 
    } as unknown as Request<{ id: string }>;
    const res = createMockResponse();

    await deleteCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No se puede eliminar el customer porque tiene pagos activos.',
    });
  });
});