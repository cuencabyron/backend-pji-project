// src/modules/session/session.service.ts

import { AppDataSource } from '@/config/data-source';
import { Session } from '@/modules/session/session.entity';
import { Customer } from '@/modules/customer/customer.entity';

import { CreateSessionDto } from '@/modules/session/dtos/create-session.dto';
import { UpdateSessionDto } from '@/modules/session/dtos/update-session.dto';

export async function findAllSessions() {
  const repo = AppDataSource.getRepository(Session);
  return repo.find({
    relations: { customer: true },
  });
}

export async function findSessionById(id: string) {
  const repo = AppDataSource.getRepository(Session);
  return repo.findOne({
    where: { session_id: id },
    relations: { customer: true },
  });
}

export async function createSessionService(dto: CreateSessionDto) {
  const sessionRepo = AppDataSource.getRepository(Session);
  const customerRepo = AppDataSource.getRepository(Customer);

  const customer = await customerRepo.findOneBy({
    customer_id: dto.customer_id,
  });

  if (!customer) {
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';
    throw error;
  }

  const entity = sessionRepo.create({
    customer,
    ip_address: dto.ip_address,
    user_agent: dto.user_agent,
    active: dto.active ?? true,
  });

  return sessionRepo.save(entity);
}

export async function updateSessionService(
  id: string,
  dto: UpdateSessionDto
) {
  const sessionRepo = AppDataSource.getRepository(Session);
  const customerRepo = AppDataSource.getRepository(Customer);

  const existing = await sessionRepo.findOne({
    where: { session_id: id },
    relations: { customer: true },
  });

  if (!existing) return null;

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

  if (dto.ip_address !== undefined) existing.ip_address = dto.ip_address;
  if (dto.user_agent !== undefined) existing.user_agent = dto.user_agent;
  if (dto.active !== undefined) existing.active = dto.active;

  return sessionRepo.save(existing);
}

export async function deleteSessionService(id: string) {
  const repo = AppDataSource.getRepository(Session);
  const result = await repo.delete({ session_id: id });
  return result.affected ?? 0;
}