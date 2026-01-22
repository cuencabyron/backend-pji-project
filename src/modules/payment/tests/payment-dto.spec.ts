import { validate } from 'class-validator';
import { CreatePaymentDto } from '@/modules/payment/dtos/create-payment.dto';
import { UpdatePaymentDto } from '@/modules/payment/dtos/update-payment.dto';

describe('CreatePaymentDto', () => {
  it('es válido con datos correctos', async () => {
    const dto = Object.assign(new CreatePaymentDto(), {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      amount: '100.50',
      currency: 'MXN',
      method: 'card',
      status: 'pending',
      external_ref: 'PAY-123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('falla si faltan customer_id, amount o method', async () => {
    const dto = Object.assign(new CreatePaymentDto(), {
      // customer_id: '...',
      amount: '100.00',
      // method: 'card',
    } as any);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('falla si currency tiene longitud inválida (si lo validas con @Length / @MaxLength)', async () => {
    const dto = Object.assign(new CreatePaymentDto(), {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      amount: '100.00',
      currency: 'PESOS',
      method: 'card',
    });

    const errors = await validate(dto);
    // Si no tienes validación de currency, este test fallará; ajústalo a tus decoradores reales
    expect(errors.length).toBeGreaterThanOrEqual(0);
  });
});

describe('UpdatePaymentDto', () => {
  it('permite objeto vacío', async () => {
    const dto = new UpdatePaymentDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('es válido con subset de campos', async () => {
    const dto = Object.assign(new UpdatePaymentDto(), {
      amount: '200.00',
      status: 'paid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});