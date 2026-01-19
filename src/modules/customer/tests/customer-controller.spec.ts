import request from 'supertest';
import app from '@/app';
import * as customerService from '@/modules/customer/customer.service';

jest.mock('@/modules/customer/customer.service');

const serviceMock = customerService as jest.Mocked<typeof customerService>;

describe('CustomerController (HTTP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/customers devuelve 200 y la lista de customers', async () => {
    serviceMock.findAllCustomers.mockResolvedValue([
      {
        customer_id: '583e2f58-e0b6-4fd2-adb1-c6b948fe32ad',
        name: 'Ana Torres',
        email: 'jana.torres@hotmail.mx',
        phone: '5545678901',
        address: 'Montejo 123, Mérida, Yuc',
        active: true,
      } as any,
    ]);

    const res = await request(app).get('/api/customers');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(serviceMock.findAllCustomers).toHaveBeenCalledTimes(1);
  });

  it('GET /api/customers/:id devuelve 200 cuando existe', async () => {
    serviceMock.findCustomerById.mockResolvedValue({
      customer_id: 'ebe310f8-41fe-4b78-bf22-7279bd8e7f7b',
      name: 'Alejandro Lopez',
      email: 'ale.lopez@yahoo.mx',
      phone: '2211530820',
      address: 'Juan Morales, Cuautla, Mor',
      active: true,
    } as any);

    const res = await request(app).get('/api/customers/ebe310f8-41fe-4b78-bf22-7279bd8e7f7b');

    expect(res.status).toBe(200);
    expect(res.body.customer_id).toBe('ebe310f8-41fe-4b78-bf22-7279bd8e7f7b');
    expect(serviceMock.findCustomerById).toHaveBeenCalledWith('ebe310f8-41fe-4b78-bf22-7279bd8e7f7b');
  });

  it('GET /api/customers/:id devuelve 404 cuando no existe', async () => {
    serviceMock.findCustomerById.mockResolvedValue(null);

    const res = await request(app).get('/api/customers/583e2f58-e0b6-4fd2-adb1-c6b948fe32ad');

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/no encontrado/i);
  });

  it('POST /api/customers crea un customer y devuelve 201', async () => {
    const dto = {
      name: 'Mauricio Gutierrez',
      email: 'maugtz@yahoo.com',
      phone: '7710936228',
      address: 'Calle Sur 45, Guadalajara, Jal',
      active: true,
    };
    const saved = { customer_id: '583e2f58-e0b6-4fd2-adb1-c6b948fe32ad', ...dto };

    serviceMock.createCustomerService.mockResolvedValue(saved as any);

    const res = await request(app).post('/api/customers').send(dto);

    expect(res.status).toBe(201);
    expect(res.body.customer_id).toBe('583e2f58-e0b6-4fd2-adb1-c6b948fe32ad');
    expect(serviceMock.createCustomerService).toHaveBeenCalledWith(dto);
  });

  it('DELETE /api/customers/:id devuelve 404 si no existía', async () => {
    serviceMock.deleteCustomerService.mockResolvedValue(0);

    const res = await request(app).delete('/api/customers/ebe310f8-41fe-4b78-bf22-7279bd8e7f7b');

    expect(res.status).toBe(404);
  });

  it('DELETE /api/customers/:id devuelve 409 si tiene pagos activos', async () => {
    const error: any = new Error('CUSTOMER_HAS_ACTIVE_PAYMENTS');
    error.code = 'CUSTOMER_HAS_ACTIVE_PAYMENTS';
    serviceMock.deleteCustomerService.mockRejectedValue(error);

    const res = await request(app).delete('/api/customers/ebe310f8-41fe-4b78-bf22-7279bd8e7f7b');

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/pagos activos/i);
  });
});