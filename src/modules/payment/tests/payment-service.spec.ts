jest.mock('@/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import { AppDataSource } from '@/config/data-source';
import { Payment } from '@/modules/payment/payment.entity';
import { Customer } from '@/modules/customer/customer.entity';
import {
  createPaymentService,
  updatePaymentService,
} from '@/modules/payment/payment.service';
import { CreatePaymentDto } from '@/modules/payment/dtos/create-payment.dto';
import { UpdatePaymentDto } from '@/modules/payment/dtos/update-payment.dto';

const getRepositoryMock = AppDataSource.getRepository as jest.Mock;

describe('PaymentService', () => {
  const paymentRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const customerRepo = {
    findOneBy: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getRepositoryMock.mockImplementation((entity) => {
      if (entity === Payment) return paymentRepo;
      if (entity === Customer) return customerRepo;
      throw new Error('Unexpected entity ' + entity);
    });
  });

  it('crea un payment con status pending por defecto', async () => {
    const dto: CreatePaymentDto = {
      customer_id: 'cust-1',
      amount: 100,
      currency: 'MXN',
      method: 'card',
      status: 'pending',
      external_ref: 'PAY-123',
    }  as any;

    customerRepo.findOneBy.mockResolvedValue({ customer_id: 'cust-1' });

    const created = {
      payment_id: 'pay-1',
      customer: { customer_id: 'cust-1' },
      amount: dto.amount,
      currency: dto.currency,
      method: dto.method,
      // status: 'pending',
      external_ref: dto.external_ref,
    };
    const saved = { ...created, created_at: new Date() };

    paymentRepo.create.mockReturnValue(created);
    paymentRepo.save.mockResolvedValue(saved);

    const result = await createPaymentService(dto);

    expect(paymentRepo.create).toHaveBeenCalledWith({
      customer: { customer_id: 'cust-1' },
      amount: dto.amount,
      currency: dto.currency,
      method: dto.method,
      status: 'pending',
      external_ref: dto.external_ref,
    });
    expect(result).toEqual(saved);
  });

  it('lanza CUSTOMER_NOT_FOUND si se cambia a un customer inexistente', async () => {
    const id = 'pay-9';
    const dto: UpdatePaymentDto = {
      customer_id: 'cust-no-existe',
      amount: 200,
      method: 'cash',
      status: 'paid',
      currency: 'MXN',
      external_ref: 'X',
    } as any;

    paymentRepo.findOne.mockResolvedValue({
      payment_id: id,
      customer: { customer_id: 'cust-1' },
    });

    customerRepo.findOneBy.mockResolvedValue(null);

    await expect(updatePaymentService(id, dto)).rejects.toMatchObject({
      code: 'CUSTOMER_NOT_FOUND',
    });
  });
});