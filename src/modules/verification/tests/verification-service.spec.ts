jest.mock('@/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import { AppDataSource } from '@/config/data-source';
import { Verification } from '@/modules/verification/verification.entity';
import { Customer } from '@/modules/customer/customer.entity';
import { Session } from '@/modules/session/session.entity';
import { Payment } from '@/modules/payment/payment.entity';
import {
  createVerificationService,
  updateVerificationService,
} from '@/modules/verification/verification.service';
import { CreateVerificationDto } from '@/modules/verification/dtos/create-verification.dto';
import { UpdateVerificationDto } from '@/modules/verification/dtos/update-verification.dto';

const getRepositoryMock = AppDataSource.getRepository as jest.Mock;

describe('VerificationService', () => {
  const verificationRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const customerRepo = { findOneBy: jest.fn() };
  const sessionRepo = { findOneBy: jest.fn() };
  const paymentRepo = { findOneBy: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();

    getRepositoryMock.mockImplementation((entity) => {
      if (entity === Verification) return verificationRepo;
      if (entity === Customer) return customerRepo;
      if (entity === Session) return sessionRepo;
      if (entity === Payment) return paymentRepo;
      throw new Error('Unexpected entity ' + entity);
    });
  });

  it('crea una verification con status pending por defecto', async () => {
    const dto: CreateVerificationDto = {
      customer_id: 'cust-1',
      session_id: 'sess-1',
      payment_id: 'pay-1',
      type: 'email',
      status: 'pending',
      attempts: 0,
    };

    customerRepo.findOneBy.mockResolvedValue({ customer_id: 'cust-1' });
    sessionRepo.findOneBy.mockResolvedValue({ session_id: 'sess-1' });
    paymentRepo.findOneBy.mockResolvedValue({ payment_id: 'pay-1' });

    const created = {
      verification_id: 'ver-1',
      customer: { customer_id: 'cust-1' },
      session: { session_id: 'sess-1' },
      payment: { payment_id: 'pay-1' },
      type: 'email',
      status: 'pending',
      attempts: 0,
    };
    const saved = { ...created, created_at: new Date() };

    verificationRepo.create.mockReturnValue(created);
    verificationRepo.save.mockResolvedValue(saved);

    const result = await createVerificationService(dto);

    expect(result).toEqual(saved);
  });

  it('lanza SESSION_NOT_FOUND si la sesión no existe al actualizar', async () => {
    const id = 'ver-9';
    const dto: UpdateVerificationDto = {
      session_id: 'sess-no-existe',
      attempts: 1,
      type: 'sms',
      status: 'pending',
      // customer_id: undefined,
      // payment_id: undefined,
    };

    verificationRepo.findOne.mockResolvedValue({
      verification_id: id,
      session: { session_id: 'sess-1' },
    });

    sessionRepo.findOneBy.mockResolvedValue(null);

    await expect(updateVerificationService(id, dto)).rejects.toMatchObject({
      code: 'SESSION_NOT_FOUND',
    });
  });
});