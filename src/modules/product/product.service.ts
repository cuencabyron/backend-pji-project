// src/modules/service/service.service.ts

import { AppDataSource } from '@/config/data-source';
import { Service } from '@/modules/service/service.entity';
import { Customer } from '@/modules/customer/customer.entity';

import { CreateServiceDto } from '@/modules/service/create-service.dto';
import { UpdateServiceDto } from '@/modules/service/update-service.dto';

/**
 * Obtiene todos los servicios.
 */
export async function findAllServices() {
  const repo = AppDataSource.getRepository(Service);
  return repo.find({
    relations: { customer: true },
  });
}

/**
 * Busca un servicio por su ID.
 */
export async function findServiceById(id: string) {
  const repo = AppDataSource.getRepository(Service);
  return repo.findOne({
    where: { service_id: id },
    relations: { customer: true },
  });
}

/**
 * Crea un nuevo servicio asociado a un customer.
 */
export async function createServiceService(dto: CreateServiceDto) {
  const serviceRepo = AppDataSource.getRepository(Service);
  const customerRepo = AppDataSource.getRepository(Customer);

  // Verificamos que exista el customer
  const customer = await customerRepo.findOneBy({
    customer_id: dto.customer_id,
  });

  if (!customer) {
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';
    throw error;
  }

  const entity = serviceRepo.create({
    name: dto.name,
    description: dto.description,
    active: dto.active ?? true,
    customer,
  });

  const saved = await serviceRepo.save(entity);
  return saved;
}

/**
 * Actualiza parcialmente un servicio existente.
 */
export async function updateServiceService(
  id: string,
  dto: UpdateServiceDto
) {
  const serviceRepo = AppDataSource.getRepository(Service);
  const customerRepo = AppDataSource.getRepository(Customer);

  const existing = await serviceRepo.findOne({
    where: { service_id: id },
    relations: { customer: true },
  });

  if (!existing) {
    return null;
  }

  // Si viene un customer_id nuevo, lo resolvemos
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

  // Actualizamos campos simples
  if (dto.name !== undefined) existing.name = dto.name;
  if (dto.description !== undefined) existing.description = dto.description;
  if (dto.active !== undefined) existing.active = dto.active;

  const saved = await serviceRepo.save(existing);
  return saved;
}

/**
 * Elimina un servicio por ID.
 * Devuelve cuántas filas se eliminaron.
 */
export async function deleteServiceService(id: string) {
  const repo = AppDataSource.getRepository(Service);
  const result = await repo.delete({ service_id: id });
  return result.affected ?? 0;
}