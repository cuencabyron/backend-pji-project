jest.mock('@/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import { AppDataSource } from '@/config/data-source';
import { Product } from '@/modules/product/product.entity';
import { Customer } from '@/modules/customer/customer.entity';
import {
  createProductService,
  updateProductService,
} from '@/modules/product/product.service';
import { CreateProductDto } from '@/modules/product/dtos/create-product.dto';
import { UpdateProductDto } from '@/modules/product/dtos/update-product.dto';

const getRepositoryMock = AppDataSource.getRepository as jest.Mock;

describe('ProductService', () => {
  const productRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const customerRepo = {
    findOneBy: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getRepositoryMock.mockImplementation((entity) => {
      if (entity === Product) return productRepo;
      if (entity === Customer) return customerRepo;
      throw new Error('Unexpected entity ' + entity);
    });
  });

  it('crea un product para un customer existente', async () => {
    const dto: CreateProductDto = {
      customer_id: 'cust-1',
      name: 'Plan Premium',
      description: 'Descripción del plan',
      min_monthly_rent: 100,
      max_monthly_rent: 300,
      active: true,
    } as any; // si tu DTO tiene tipos string/decimal ajusta aquí

    customerRepo.findOneBy.mockResolvedValue({ customer_id: 'cust-1' });

    const created = {
      product_id: 'prod-1',
      customer: { customer_id: 'cust-1' },
      name: dto.name,
      description: dto.description,
      min_monthly_rent: dto.min_monthly_rent,
      max_monthly_rent: dto.max_monthly_rent,
      active: dto.active,
    };
    const saved = { ...created, created_at: new Date() };

    productRepo.create.mockReturnValue(created);
    productRepo.save.mockResolvedValue(saved);

    const result = await createProductService(dto);

    expect(result).toEqual(saved);
  });

  it('lanza CUSTOMER_NOT_FOUND si se asigna un customer inexistente al actualizar', async () => {
    const id = 'prod-9';
    const dto: UpdateProductDto = {
      customer_id: 'cust-no-existe',
      name: 'Nuevo nombre',
      description: 'Nueva descripción',
      min_monthly_rent: 200,
      max_monthly_rent: 400,
      active: false,
    } as any;

    productRepo.findOne.mockResolvedValue({
      product_id: id,
      customer: { customer_id: 'cust-1' },
    });

    customerRepo.findOneBy.mockResolvedValue(null);

    await expect(updateProductService(id, dto)).rejects.toMatchObject({
      code: 'CUSTOMER_NOT_FOUND',
    });
  });
});