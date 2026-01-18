// tests/dtos/product-dto.spec.ts
import { validate } from 'class-validator';
import { CreateProductDto } from '@/modules/product/dtos/create-product.dto';
import { UpdateProductDto } from '@/modules/product/dtos/update-product.dto';

describe('CreateProductDto', () => {
  it('es válido con datos correctos', async () => {
    const dto = Object.assign(new CreateProductDto(), {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Servicio PJI',
      description: 'Descripción del servicio',
      min_monthly_rent: 100,
      max_monthly_rent: 500,
      active: true,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('falla si falta customer_id, name o description', async () => {
    const dto = Object.assign(new CreateProductDto(), {
      // customer_id: '...', // falta
      name: 'Servicio',
      // description: '...',  // falta
    } as any);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const props = errors.map((e) => e.property);
    expect(props).toContain('customer_id');
    expect(props).toContain('description');
  });

  it('falla si customer_id no es UUID', async () => {
    const dto = Object.assign(new CreateProductDto(), {
      customer_id: 'no-uuid',
      name: 'Servicio',
      description: 'Desc',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const propNames = errors.map((e) => e.property);
    expect(propNames).toContain('customer_id');
  });
});

describe('UpdateProductDto', () => {
  it('permite objeto vacío', async () => {
    const dto = new UpdateProductDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('es válido con subset de campos', async () => {
    const dto = Object.assign(new UpdateProductDto(), {
      name: 'Nuevo nombre',
      max_monthly_rent: '999.99',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('falla si se manda customer_id no válido', async () => {
    const dto = Object.assign(new UpdateProductDto(), {
      customer_id: 'malo',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});