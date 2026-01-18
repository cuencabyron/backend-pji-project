import { validate } from 'class-validator';
import { CreateSessionDto } from '@/modules/session/dtos/create-session.dto';
import { UpdateSessionDto } from '@/modules/session/dtos/update-session.dto';

describe('CreateSessionDto', () => {
  it('es válido con datos correctos', async () => {
    const dto = Object.assign(new CreateSessionDto(), {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0)',
      status: 'active',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('falla si faltan customer_id o user_agent', async () => {
    const dto = Object.assign(new CreateSessionDto(), {
      // customer_id: '...',
      // user_agent: '...',
    } as any);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateSessionDto', () => {
  it('permite objeto vacío', async () => {
    const dto = new UpdateSessionDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('es válido con subset de campos', async () => {
    const dto = Object.assign(new UpdateSessionDto(), {
      status: 'closed',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});