// DataSource de TypeORM ya configurado (host, usuario, password, entidades, etc.).
import { AppDataSource } from '@/config/data-source';

// Entidad que mapea la tabla "payment" en la base de datos.
import { Payment } from '@/modules/payment/payment.entity';

// Entidad que mapea la tabla "customer" en la base de datos.
import { Customer } from '@/modules/customer/customer.entity';

// Entidad que mapea la tabla "product" en la base de datos.
import { Product } from '@/modules/product/product.entity';

// DTO que define la forma esperada de los datos para CREAR un payment.
import { CreatePaymentDto } from '@/modules/payment/dtos/create-payment.dto';

// DTO que define la forma esperada de los datos para ACTUALIZAR un payment.
import { UpdatePaymentDto } from '@/modules/payment/dtos/update-payment.dto';


export async function findAllPayments() 
{
  const repo = AppDataSource.getRepository(Payment);

  return repo.find({
    relations: { customer: true, product: true, },
  });
}


export async function findPaymentById(id: string) 
{
  const repo = AppDataSource.getRepository(Payment);

  return repo.findOne({
    where: { payment_id: id },
    relations: { customer: true, product: true, },
  });
}


export async function createPaymentService(dto: CreatePaymentDto) 
{
  const paymentRepo = AppDataSource.getRepository(Payment);
  const customerRepo = AppDataSource.getRepository(Customer);
  const productRepo = AppDataSource.getRepository(Product);

  const customer = await customerRepo.findOneBy({
    customer_id: dto.customer_id,
  });

  if (!customer) {
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';
    throw error;
  }

  const product = await productRepo.findOneBy({
    product_id: dto.product_id,
  });

  if (!product) 
  {
    const error: any = new Error('Product no encontrado');
    error.code = 'PRODUCT_NOT_FOUND';
    throw error;
  }

  const amount = product.min_monthly_rent.toString();
  const currency = 'MXN';
  const status = 'pending';
  const external_ref = `PAY-${Date.now()}`;

  const entity = paymentRepo.create({
    customer,
    product,
    amount,
    currency,
    method: dto.method,
    status,
    external_ref,
  });

  return paymentRepo.save(entity);
}


export async function updatePaymentService(id: string, dto: UpdatePaymentDto) 
{
  const paymentRepo = AppDataSource.getRepository(Payment);

  const customerRepo = AppDataSource.getRepository(Customer);

  const productRepo = AppDataSource.getRepository(Product);

  const existing = await paymentRepo.findOne({
    where: { payment_id: id },
    relations: { customer: true, product: true, },
  });

  if (!existing) return null;

  if (dto.method !== undefined) existing.method = dto.method;
  if (dto.status !== undefined) 
  {
    const wasPaid = existing.status === 'paid';
    existing.status = dto.status;

    if (!wasPaid && dto.status === 'paid') {
      existing.paid_at = new Date();
    }
  }

  return paymentRepo.save(existing);
}


export async function deletePaymentService(id: string) 
{
  const repo = AppDataSource.getRepository(Payment);

  const result = await repo.delete({ payment_id: id });

  return result.affected ?? 0;
}