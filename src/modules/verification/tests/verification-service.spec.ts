import { AppDataSource } from '@/config/data-source';
import { Verification } from '@/modules/verification/verification.entity';
import { Session } from '@/modules/session/session.entity';
import { Payment } from '@/modules/payment/payment.entity';
import { Customer } from '@/modules/customer/customer.entity';
import {
  findAllVerifications,
  findVerificationById,
  createVerificationService,
  updateVerificationService,
  deleteVerificationService,
} from '@/modules/verification/verification.service';
import { CreateVerificationDto } from '@/modules/verification/dtos/create-verification.dto';
import { UpdateVerificationDto } from '@/modules/verification/dtos/update-verification.dto';

jest.mock('@/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

const mockGetRepository = AppDataSource.getRepository as jest.Mock;

function createVerificationRepoMock() {
  return {
    find: jest.fn(),
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

describe('VerificationService (unit tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findAllVerifications → devuelve todas las verificaciones', async () => {
    const repo = createVerificationRepoMock();
    const fake: Verification[] = [
      {
        verification_id: 'ver-1',
        customer_id: 'cust-1',
        session_id: 'sess-1',
        payment_id: 'pay-1',
        type: 'email',
        status: 'pending',
        attempts: 3,
        created_at: new Date(),
        updated_at: new Date(),
      } as Verification,
    ];

    repo.find.mockResolvedValue(fake);
    mockGetRepository.mockReturnValueOnce(repo);

    const result = await findAllVerifications();
    expect(result).toEqual(fake);
  });

  it('findVerificationById → devuelve null si no existe', async () => {
    const repo = createVerificationRepoMock();

    repo.findOne.mockResolvedValue(null);
    mockGetRepository.mockReturnValueOnce(repo);

    const result = await findVerificationById('ver-404');
    expect(result).toBeNull();
  });

  it('createVerificationService → lanza SESSION_NOT_FOUND si no existe la sesión', async () => 
  {
    const verificationRepo = createVerificationRepoMock();
    
    const sessionRepo = { findOneBy: jest.fn().mockResolvedValue(null) };
    const paymentRepo = { findOneBy: jest.fn() };


    const dto: CreateVerificationDto = {
      customer_id: 'cust-1',
      session_id: 'sess-no-existe',
      payment_id: 'pay-1',
      type: 'email',
      status: 'pending',
      attempts: 3,
    };

    mockGetRepository
      .mockReturnValueOnce(verificationRepo)
      .mockReturnValueOnce(customerRepo)
      .mockReturnValueOnce(sessionRepo)
      .mockReturnValueOnce(paymentRepo);

    await expect(createVerificationService(dto as any)).rejects.toMatchObject({
      code: 'SESSION_NOT_FOUND',
    });
  });


  it('createVerificationService → incrementa attempts y guarda', async () => 
  {
    const verificationRepo = createVerificationRepoMock();

    const customerRepo = {
      findOneBy: jest
        .fn()
        .mockResolvedValue({ customer_id: 'cust-1' } as Customer),
      };

    const sessionRepo = { 
      findOneBy: jest
        .fn()
        .mockResolvedValue({ session_id: 'sess-1' } as Session), 
      };

    const paymentRepo = {
      findOneBy: jest
        .fn()
        .mockResolvedValue({ payment_id: 'pay-1' } as Payment),
    };

    const dto: CreateVerificationDto = {
      customer_id: 'cust-1',
      session_id: 'sess-1',
      payment_id: 'pay-1',
      type: 'sms',
      status: 'pending',
      attempts: 1,
    };

    const fakeVerification = {
      verification_id: 'ver-1',
      ...dto,
    } as Verification;

    verificationRepo.create.mockReturnValue(fakeVerification);
    verificationRepo.save.mockResolvedValue(fakeVerification);

    mockGetRepository
      .mockReturnValueOnce(verificationRepo)
      .mockReturnValueOnce(customerRepo)
      .mockReturnValueOnce(sessionRepo)
      .mockReturnValueOnce(paymentRepo);

    const result = await createVerificationService(dto);

    expect(customerRepo.findOneBy).toHaveBeenCalledWith({
      customer_id: dto.customer_id,
    });
    expect(sessionRepo.findOneBy).toHaveBeenCalledWith({
      session_id: dto.session_id,
    });
    expect(paymentRepo.findOneBy).toHaveBeenCalledWith({
      payment_id: dto.payment_id,
    });
    expect(verificationRepo.create).toHaveBeenCalled();
    expect(verificationRepo.save).toHaveBeenCalledWith(fakeVerification);

    expect(result).toEqual(fakeVerification);
  });

  it('updateVerificationService → devuelve null si no existe', async () => {
    const verificationRepo = createVerificationRepoMock();
    const sessionRepo = { findOneBy: jest.fn() };
    const paymentRepo = { findOneBy: jest.fn() };

    verificationRepo.findOne.mockResolvedValue(null);

    mockGetRepository
      .mockReturnValueOnce(verificationRepo)
      .mockReturnValueOnce(sessionRepo)
      .mockReturnValueOnce(paymentRepo);

    const dto: UpdateVerificationDto = { status: 'approved' };

    const result = await updateVerificationService('ver-404', dto);
    expect(result).toBeNull();
  });

  it('deleteVerificationService → devuelve 1 si se elimina la verificación', async () => {
    const verificationRepo = createVerificationRepoMock();
    verificationRepo.delete.mockResolvedValue({ affected: 1 });

    mockGetRepository.mockReturnValueOnce(verificationRepo);

    const affected = await deleteVerificationService('ver-1');
    expect(affected).toBe(1);
  });
});
