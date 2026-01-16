import { AppDataSource } from '@/config/data-source';
import { Product } from '@/modules/product/product.entity';
import { Customer } from '@/modules/customer/customer.entity';

import { CreateProductDto } from '@/modules/product/dtos/create-product.dto';
import { UpdateProductDto } from '@/modules/product/dtos/update-product.dto';


export async function findAllProducts() 
{
  const repo = AppDataSource.getRepository(Product);
  return repo.find({
    relations: { customer: true },
  });
}


export async function findProductById(id: string) 
{
  const repo = AppDataSource.getRepository(Product);
  return repo.findOne({
    where: { product_id: id },
    relations: { customer: true },
  });
}

export async function createProductService(dto: CreateProductDto) 
{
  const productRepo = AppDataSource.getRepository(Product);
  const customerRepo = AppDataSource.getRepository(Customer);

  const customer = await customerRepo.findOneBy({
    customer_id: dto.customer_id,
  });

  if (!customer) {
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';
    throw error;
  }

  const entity = productRepo.create({
    name: dto.name,
    description: dto.description,
    min_monthly_rent: dto.min_monthly_rent,
    max_monthly_rent: dto.max_monthly_rent,
    active: dto.active ?? true,
    customer,
  });

  const saved = await productRepo.save(entity);
  return saved;
}

export async function updateProductService(id: string, dto: UpdateProductDto) 
{
  const productRepo = AppDataSource.getRepository(Product);
  const customerRepo = AppDataSource.getRepository(Customer);

  const existing = await productRepo.findOne({
    where: { product_id: id },
    relations: { customer: true },
  });

  if (!existing) {
    return null;
  }

  if (dto.customer_id) {
    const newCustomer = await customerRepo.findOneBy({
      customer_id: dto.customer_id,
    });

    if (!newCustomer) {
      const error: any = new Error('Customer no encontrado');
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }

    existing.customer = newCustomer;
  }

  if (dto.name !== undefined) existing.name = dto.name;
  if (dto.description !== undefined) existing.description = dto.description;
  if (dto.min_monthly_rent !== undefined) existing.min_monthly_rent = dto.min_monthly_rent;
  if (dto.max_monthly_rent !== undefined) existing.max_monthly_rent = dto. max_monthly_rent;
  if (dto.active !== undefined) existing.active = dto.active;

  const saved = await productRepo.save(existing);
  return saved;
}


export async function deleteProductService(id: string) 
{
  const repo = AppDataSource.getRepository(Product);
  const result = await repo.delete({ product_id: id });
  return result.affected ?? 0;
}