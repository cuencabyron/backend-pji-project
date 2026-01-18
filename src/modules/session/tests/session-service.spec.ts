jest.mock('@/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import { AppDataSource } from '@/config/data-source';
import { Session } from '@/modules/session/session.entity';
import { Customer } from '@/modules/customer/customer.entity';
import {
  createSessionService,
  updateSessionService,
} from '@/modules/session/session.service';
import { CreateSessionDto } from '@/modules/session/dtos/create-session.dto';
import { UpdateSessionDto } from '@/modules/session/dtos/update-session.dto';

const getRepositoryMock = AppDataSource.getRepository as jest.Mock;

describe('SessionService', () => {
  const sessionRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const customerRepo = {
    findOneBy: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getRepositoryMock.mockImplementation((entity) => {
      if (entity === Session) return sessionRepo;
      if (entity === Customer) return customerRepo;
      throw new Error('Unexpected entity ' + entity);
    });
  });

  it('crea una sesión para un customer existente', async () => {
    const dto: CreateSessionDto = {
      customer_id: 'cust-1',
      user_agent: 'Chrome',
      // status: undefined, // debe ir por defecto a "active"
    };

    customerRepo.findOneBy.mockResolvedValue({ customer_id: 'cust-1' });

    const created = {
      session_id: 'sess-1',
      customer: { customer_id: 'cust-1' },
      user_agent: dto.user_agent,
      status: 'active',
    };
    const saved = { ...created, created_at: new Date() };

    sessionRepo.create.mockReturnValue(created);
    sessionRepo.save.mockResolvedValue(saved);

    const result = await createSessionService(dto);

    expect(customerRepo.findOneBy).toHaveBeenCalledWith({
      customer_id: dto.customer_id,
    });
    expect(sessionRepo.create).toHaveBeenCalledWith({
      customer: { customer_id: 'cust-1' },
      user_agent: dto.user_agent,
      status: 'active',
    });
    expect(result).toEqual(saved);
  });

  it('lanza CUSTOMER_NOT_FOUND si el customer no existe al actualizar', async () => {
    const id = 'sess-99';
    const dto: UpdateSessionDto = {
      customer_id: 'cust-no-existe',
      user_agent: 'Firefox',
      //status: 'inactive',
    };

    sessionRepo.findOne.mockResolvedValue({
      session_id: id,
      customer: { customer_id: 'cust-1' },
      user_agent: 'Chrome',
      status: 'active',
    });

    customerRepo.findOneBy.mockResolvedValue(null);

    await expect(updateSessionService(id, dto)).rejects.toMatchObject({
      code: 'CUSTOMER_NOT_FOUND',
    });
  });
});