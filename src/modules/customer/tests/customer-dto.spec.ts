import { validate } from 'class-validator';
import { CreateCustomerDto } from '@/modules/customer/dtos/create-customer.dto';
import { UpdateCustomerDto } from '@/modules/customer/dtos/update-customer.dto';

describe('CreateCustomerDto', () => {
  it('es válido con datos correctos', async () => {
    const dto = Object.assign(new CreateCustomerDto(), {
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '5512345678',
      address: 'Calle 1 #123, CDMX',
      active: true,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('falla si falta name, email, phone o address', async () => {
    // Construimos a propósito un DTO incompleto (usamos "as any" para saltar el chequeo de TypeScript)
    const dto = Object.assign(new CreateCustomerDto(), {
      // name: 'Juan',   // falta
      email: 'juan@example.com',
      phone: '5512345678',
      // address: '...', // falta
    } as any);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    // Podemos comprobar que hay al menos un error relacionado con "name" o "address"
    const props = errors.map((e) => e.property);
    expect(props).toContain('name');
    expect(props).toContain('address');
  });

  it('falla si el email tiene formato inválido', async () => {
    const dto = Object.assign(new CreateCustomerDto(), {
      name: 'Juan',
      email: 'no-es-email',
      phone: '5512345678',
      address: 'Calle 1',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });
});

describe('UpdateCustomerDto', () => {
  it('permite un objeto vacío (todos los campos opcionales)', async () => {
    const dto = new UpdateCustomerDto();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('es válido si se envía solo un subconjunto de campos', async () => {
    const dto = Object.assign(new UpdateCustomerDto(), {
      name: 'Nombre Actualizado',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('falla si se envía un email con formato inválido', async () => {
    const dto = Object.assign(new UpdateCustomerDto(), {
      email: 'correo-malo',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });
});