import { AppDataSource } from '@/config/data-source';

import { Verification } from '@/modules/verification/verification.entity';
import { Customer } from '@/modules/customer/customer.entity';
import { Session } from '@/modules/session/session.entity';
import { Payment } from '@/modules/payment/payment.entity';

import {
  findAllVerifications,
  findVerificationById,
  createVerificationService,
  updateVerificationService,
  deleteVerificationService,
} from '@/modules/verification/verification.service';

jest.mock('@/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

const mockGetRepository = AppDataSource.getRepository as jest.Mock;

function createVerificationRepoMock() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

function createSimpleRepoMock() {
  return {
    findOneBy: jest.fn(),
  };
}

describe('VerificationService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ======================================================
  // findAllVerifications
  // ======================================================

  it('findAllVerifications → devuelve todas las verifications', async () => 
  {
    const repo = createVerificationRepoMock();

    mockGetRepository.mockImplementation((entity) => {
      if (entity === Verification) return repo;
    });

    const fake = [{ verification_id: '1' }];

    repo.find.mockResolvedValue(fake);

    const result = await findAllVerifications();

    expect(repo.find).toHaveBeenCalledWith({
      relations: { customer: true, session: true, payment: true },
      order: { created_at: 'DESC' },
    });

    expect(result).toEqual(fake);

  });

  // ======================================================
  // findVerificationById
  // ======================================================

  it('findVerificationById → devuelve verification si existe', async () => 
  {
    const repo = createVerificationRepoMock();

    mockGetRepository.mockImplementation((entity) => {
      if (entity === Verification) return repo;
    });

    const fake = { verification_id: '1' };

    repo.findOne.mockResolvedValue(fake);

    const result = await findVerificationById('1');

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { verification_id: '1' },
      relations: { customer: true, session: true, payment: true },
    });

    expect(result).toEqual(fake);

  });

  it('findVerificationById → devuelve null si no existe', async () => 
  {
    const repo = createVerificationRepoMock();

    mockGetRepository.mockImplementation((entity) => {
      if (entity === Verification) return repo;
    });

    repo.findOne.mockResolvedValue(null);

    const result = await findVerificationById('no-existe');

    expect(result).toBeNull();

  });

  // ======================================================
  // createVerificationService
  // ======================================================

  it('createVerificationService → crea verification correctamente', async () => 
  {
    const verificationRepo = createVerificationRepoMock();
    const customerRepo = createSimpleRepoMock();
    const sessionRepo = createSimpleRepoMock();
    const paymentRepo = createSimpleRepoMock();

    mockGetRepository.mockImplementation((entity) => {
      if (entity === Verification) return verificationRepo;
      if (entity === Customer) return customerRepo;
      if (entity === Session) return sessionRepo;
      if (entity === Payment) return paymentRepo;
    });

    const dto = {
      customer_id: 'c1',
      session_id: 's1',
      payment_id: 'p1',
      type: 'identity',
      attempts: 1,
      status: 'pending',
    };

    const customer = { customer_id: 'c1' };
    const session = { session_id: 's1' };
    const payment = { payment_id: 'p1' };

    const created = { ...dto };
    const saved = { verification_id: '1', ...dto };

    customerRepo.findOneBy.mockResolvedValue(customer);
    sessionRepo.findOneBy.mockResolvedValue(session);
    paymentRepo.findOneBy.mockResolvedValue(payment);

    verificationRepo.create.mockReturnValue(created);
    verificationRepo.save.mockResolvedValue(saved);

    const result = await createVerificationService(dto as any);

    expect(verificationRepo.save).toHaveBeenCalledWith(created);

    expect(result).toEqual(saved);

  });

  it('createVerificationService → lanza CUSTOMER_NOT_FOUND', async () => 
  {
    const verificationRepo = createVerificationRepoMock();
    const customerRepo = createSimpleRepoMock();
    const sessionRepo = createSimpleRepoMock();
    const paymentRepo = createSimpleRepoMock();

    mockGetRepository.mockImplementation((entity) => {
      if (entity === Verification) return verificationRepo;
      if (entity === Customer) return customerRepo;
      if (entity === Session) return sessionRepo;
      if (entity === Payment) return paymentRepo;
    });

    customerRepo.findOneBy.mockResolvedValue(null);

    const dto = {
      customer_id: 'no',
      session_id: 's1',
      payment_id: 'p1',
      type: 'identity',
      attempts: 1,
    };

    await expect(createVerificationService(dto as any)).rejects.toMatchObject({
      code: 'CUSTOMER_NOT_FOUND',
    });

  });

  // ======================================================
  // updateVerificationService
  // ======================================================

  it('updateVerificationService → devuelve null si verification no existe', async () => 
  {
    const verificationRepo = createVerificationRepoMock();

    mockGetRepository.mockImplementation((entity) => {
      if (entity === Verification) return verificationRepo;
    });

    verificationRepo.findOne.mockResolvedValue(null);

    const result = await updateVerificationService('no-existe', {});

    expect(result).toBeNull();

  });

  it('updateVerificationService → actualiza verification', async () => 
  {
    const verificationRepo = createVerificationRepoMock();
    const customerRepo = createSimpleRepoMock();
    const sessionRepo = createSimpleRepoMock();
    const paymentRepo = createSimpleRepoMock();

    mockGetRepository.mockImplementation((entity) => {
      if (entity === Verification) return verificationRepo;
      if (entity === Customer) return customerRepo;
      if (entity === Session) return sessionRepo;
      if (entity === Payment) return paymentRepo;
    });

    const existing = {
      verification_id: '1',
      type: 'identity',
      status: 'pending',
      attempts: 1,
    };

    verificationRepo.findOne.mockResolvedValue(existing);

    verificationRepo.save.mockImplementation(async (entity) => entity);

    const result = await updateVerificationService('1', {
      status: 'approved',
    });

    expect(verificationRepo.save).toHaveBeenCalled();

    expect(result).toEqual(
      expect.objectContaining({
        verification_id: '1',
        status: 'approved',
      })
    );

  });

  // ======================================================
  // deleteVerificationService
  // ======================================================

  it('deleteVerificationService → devuelve 1 si elimina', async () => 
  {
    const repo = createVerificationRepoMock();

    mockGetRepository.mockImplementation((entity) => {
      if (entity === Verification) return repo;
    });

    repo.delete.mockResolvedValue({ affected: 1 });

    const result = await deleteVerificationService('1');

    expect(repo.delete).toHaveBeenCalledWith({
      verification_id: '1',
    });

    expect(result).toBe(1);

  });

  it('deleteVerificationService → devuelve 0 si no elimina', async () => 
  {
    const repo = createVerificationRepoMock();

    mockGetRepository.mockImplementation((entity) => {
      if (entity === Verification) return repo;
    });

    repo.delete.mockResolvedValue({ affected: 0 });

    const result = await deleteVerificationService('no-existe');

    expect(result).toBe(0);
  });
});