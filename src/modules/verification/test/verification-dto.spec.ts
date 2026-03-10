import { validate } from 'class-validator';

import { CreateVerificationDto } from '@/modules/verification/dtos/create-verification.dto';
import { UpdateVerificationDto } from '@/modules/verification/dtos/update-verification.dto';

describe('CreateVerificationDto', () => {

  it('es válido con datos correctos', async () => 
  {
    const dto = Object.assign(new CreateVerificationDto(), {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      session_id: '550e8400-e29b-41d4-a716-446655440001',
      payment_id: '550e8400-e29b-41d4-a716-446655440002',
      type: 'identity',
      status: 'pending',
      attempts: 1,
    });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);

  });

  it('falla si faltan campos obligatorios', async () => 
  {
    const dto = Object.assign(new CreateVerificationDto(), {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
    } as any);

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

  it('falla si customer_id no es UUID', async () => 
  {
    const dto = Object.assign(new CreateVerificationDto(), {
      customer_id: '123',
      session_id: '550e8400-e29b-41d4-a716-446655440001',
      payment_id: '550e8400-e29b-41d4-a716-446655440002',
      type: 'identity',
      attempts: 1,
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

  it('falla si status es inválido', async () => 
  {
    const dto = Object.assign(new CreateVerificationDto(), {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      session_id: '550e8400-e29b-41d4-a716-446655440001',
      payment_id: '550e8400-e29b-41d4-a716-446655440002',
      type: 'identity',
      status: 'invalid',
      attempts: 1,
    } as any);

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

  it('falla si attempts es negativo', async () => 
  {
    const dto = Object.assign(new CreateVerificationDto(), {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      session_id: '550e8400-e29b-41d4-a716-446655440001',
      payment_id: '550e8400-e29b-41d4-a716-446655440002',
      type: 'identity',
      attempts: -1,
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

});

describe('UpdateVerificationDto', () => {

  it('permite objeto vacío', async () => 
  {
    const dto = new UpdateVerificationDto();

    const errors = await validate(dto);

    expect(errors.length).toBe(0);

  });

  it('es válido con subset de campos', async () => 
  {
    const dto = Object.assign(new UpdateVerificationDto(), {
      status: 'approved',
      attempts: 2,
    });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });
});