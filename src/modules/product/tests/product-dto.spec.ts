import { validate } from 'class-validator';

import { CreateProductDto } from '@/modules/product/dtos/create-product.dto';
import { UpdateProductDto } from '@/modules/product/dtos/update-product.dto';

describe('CreateProductDto', () => {

  it('es válido con datos correctos', async () => 
  {

    const dto = Object.assign(new CreateProductDto(), {
      name: 'Plan básico',
      description: 'Cobertura básica',
      min_monthly_rent: '1000.000',
      max_monthly_rent: '3000.000',
      active: true,
    });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);

  });

  it('falla si faltan campos obligatorios', async () => 
  {

    const dto = Object.assign(new CreateProductDto(), {
      name: 'Plan básico',
    } as any);

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

  it('falla si name supera longitud máxima', async () => 
  {

    const dto = Object.assign(new CreateProductDto(), {
      name: 'A'.repeat(101),
      description: 'Desc',
      min_monthly_rent: '1000.000',
      max_monthly_rent: '3000.000',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

  it('falla si description supera longitud máxima', async () => 
  {

    const dto = Object.assign(new CreateProductDto(), {
      name: 'Plan',
      description: 'A'.repeat(256),
      min_monthly_rent: '1000.000',
      max_monthly_rent: '3000.000',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

  it('falla si min_monthly_rent no es número', async () => 
  {

    const dto = Object.assign(new CreateProductDto(), {
      name: 'Plan',
      description: 'Desc',
      min_monthly_rent: 'abc',
      max_monthly_rent: '3000.000',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

});

describe('UpdateProductDto', () => {

  it('permite objeto vacío', async () => 
  {

    const dto = new UpdateProductDto();

    const errors = await validate(dto);

    expect(errors.length).toBe(0);

  });

  it('es válido con subset de campos', async () => 
  {

    const dto = Object.assign(new UpdateProductDto(), {
      name: 'Nuevo plan',
      active: false,
    });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);

  });

});