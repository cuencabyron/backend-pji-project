jest.mock('@/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import { AppDataSource } from '@/config/data-source';
import { Customer } from '@/modules/customer/customer.entity';
import { Payment } from '@/modules/payment/payment.entity';
import {
  createCustomerService,
  deleteCustomerService,
} from '@/modules/customer/customer.service';
import { CreateCustomerDto } from '@/modules/customer/dtos/create-customer.dto';

const getRepositoryMock = AppDataSource.getRepository as jest.Mock;

describe('CustomerService', () => {
  const customerRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const paymentRepo = {
    count: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Según la entidad, devolvemos el repositorio correspondiente
    getRepositoryMock.mockImplementation((entity) => {
      if (entity === Customer) return customerRepo;
      if (entity === Payment) return paymentRepo;
      throw new Error('Unexpected entity ' + entity);
    });
  });

  it('crea un customer cuando el email es único', async () => {
    const dto: CreateCustomerDto = {
      name: 'Byron',
      email: 'byron@example.com',
      phone: '+52 (55) 1234-5678',
      address: 'CDMX',
      active: true,
    };

    // No existe otro customer con ese email
    customerRepo.findOne.mockResolvedValue(null);

    // Entidad creada y guardada (simulada)
    const created = { customer_id: 'uuid-1', ...dto, phone: '+525512345678' };
    const saved = { ...created, created_at: new Date() };

    customerRepo.create.mockReturnValue(created);
    customerRepo.save.mockResolvedValue(saved);

    const result = await createCustomerService(dto);

    expect(customerRepo.findOne).toHaveBeenCalledWith({
      where: { email: dto.email },
    });
    expect(customerRepo.create).toHaveBeenCalled();
    expect(customerRepo.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(saved);
  });

  it('lanza EMAIL_IN_USE si el email ya existe', async () => {
    const dto: CreateCustomerDto = {
      name: 'Otro',
      email: 'duplicado@example.com',
      phone: '55 1111 2222',
      address: 'CDMX',
      active: true,
    };

    // Ya hay alguien con ese email
    customerRepo.findOne.mockResolvedValue({ customer_id: 'uuid-x', ...dto });

    await expect(createCustomerService(dto)).rejects.toMatchObject({
      message: 'EMAIL_IN_USE',
    });

    expect(customerRepo.create).not.toHaveBeenCalled();
    expect(customerRepo.save).not.toHaveBeenCalled();
  });

  it('no permite borrar customer con pagos pendientes', async () => {
    const id = 'customer-1';

    customerRepo.findOneBy.mockResolvedValue({ customer_id: id });
    paymentRepo.count.mockResolvedValue(3); // 3 pagos pending

    await expect(deleteCustomerService(id)).rejects.toMatchObject({
      message: 'CUSTOMER_HAS_ACTIVE_PAYMENTS',
    });

    expect(customerRepo.delete).not.toHaveBeenCalled();
  });

  it('borra el customer cuando no tiene pagos pendientes', async () => {
    const id = 'customer-2';

    customerRepo.findOneBy.mockResolvedValue({ customer_id: id });
    paymentRepo.count.mockResolvedValue(0);
    customerRepo.delete.mockResolvedValue({ affected: 1 });

    const affected = await deleteCustomerService(id);

    expect(paymentRepo.count).toHaveBeenCalled();
    expect(customerRepo.delete).toHaveBeenCalledWith({ customer_id: id });
    expect(affected).toBe(1);
  });
});