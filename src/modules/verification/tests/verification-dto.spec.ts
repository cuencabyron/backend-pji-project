import { validate } from 'class-validator';
import { CreateVerificationDto } from '@/modules/verification/dtos/create-verification.dto';
import { UpdateVerificationDto } from '@/modules/verification/dtos/update-verification.dto';

describe('CreateVerificationDto', () => {
  it('es válido con datos correctos', async () => {
    const dto = Object.assign(new CreateVerificationDto(), {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      session_id: '550e8400-e29b-41d4-a716-446655440001',
      payment_id: '550e8400-e29b-41d4-a716-446655440002',
      type: 'email',
      status: 'pending',
      attempts: 0,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('falla si faltan IDs o attempts', async () => {
    const dto = Object.assign(new CreateVerificationDto(), {
      // customer_id: '...',
      // session_id: '...',
      // payment_id: '...',
      type: 'email',
      // attempts: 0,
    } as any);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('falla si attempts es negativo (si usas @Min(0))', async () => {
    const dto = Object.assign(new CreateVerificationDto(), {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      session_id: '550e8400-e29b-41d4-a716-446655440001',
      payment_id: '550e8400-e29b-41d4-a716-446655440002',
      type: 'email',
      status: 'pending',
      attempts: -1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateVerificationDto', () => {
  it('permite objeto vacío', async () => {
    const dto = new UpdateVerificationDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('es válido con subset de campos', async () => {
    const dto = Object.assign(new UpdateVerificationDto(), {
      status: 'success',
      attempts: 3,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
