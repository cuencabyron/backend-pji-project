import { normalizePhone } from '@/modules/customer/customer.service';

describe('normalizePhone', () => {
  it('elimina espacios, guiones y paréntesis', () => {
    const input = '55 1234-5678';
    const result = normalizePhone(input);
    expect(result).toBe('5512345678');
  });

  it('conserva el + inicial y limpia el resto', () => {
    const input = '+52 (55) 1234-5678';
    const result = normalizePhone(input);
    expect(result).toBe('+525512345678');
  });

  it('devuelve el mismo valor si viene vacío o undefined', () => {
    expect(normalizePhone('')).toBe('');
  });
});