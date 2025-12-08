import { Request, Response } from 'express';
import { serviceRepo } from '../repositories/service.repo';
import { AppDataSource } from '../data-source';
import { Customer } from '../entities/Customer';

type ServiceBody = 
{
  customer_id: string;
  name: string;
  description: string;
  active?: boolean;
};

// ====== GET /api/services ======
export async function listServices(_req: Request, res: Response) 
{
  try {
    const repo = serviceRepo();
    const items = await repo.find();
    res.json(items);
  } catch (err) {
    console.error('Error listando services:', err);
    res.status(500).json({ message: 'Error listando services' });
  }
}

// ====== GET /api/services/:id ======
export async function getService(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;
    const repo = serviceRepo();
    const item = await repo.findOneBy({ service_id: id });

    if (!item) {
      return res.status(404).json({ message: 'Service no encontrado' });
    }

    res.json(item);
  } catch (err) {
    console.error('Error obteniendo service:', err);
    res.status(500).json({ message: 'Error obteniendo service' });
  }
}

// ====== POST /api/services ======
export async function createService(req: Request<{}, {}, ServiceBody>, res: Response) 
{
  try {
    const { customer_id, name, description, active = true } = req.body ?? {};

    if (!customer_id || !name || !description) {
      return res.status(400).json({
        message: 'customer_id, name y description son requeridos',
      });
    }

    const customerRepo = AppDataSource.getRepository(Customer);
    const exists = await customerRepo.findOneBy({ customer_id });
    if (!exists) {
      return res.status(400).json({ message: 'customer_id no existe' });
    }

    const repo = serviceRepo();
    const entity = repo.create({ customer_id, name, description, active });
    const saved = await repo.save(entity);
    res.status(200).json(saved);
  } catch (err: any) {
    console.error('Error creando service:', err);
    res.status(500).json({ message: 'Error creando service' });
  }
}

// ====== PUT /api/services/:id ======
export async function updateService(req: Request<{ id: string }, unknown, Partial<ServiceBody>>, res: Response) 
{
  try {
    const { id } = req.params;
    const repo = serviceRepo();
    const existing = await repo.findOneBy({ service_id: id });

    if (!existing) {
      return res.status(404).json({ message: 'Service no encontrado' });
    }

    const { customer_id, name, description, active } = req.body ?? {};

    if (customer_id !== undefined) {
      const customerRepo = AppDataSource.getRepository(Customer);
      const exists = await customerRepo.findOneBy({ customer_id });
      if (!exists) {
        return res.status(400).json({ message: 'customer_id no existe' });
      }
      (existing as any).customer_id = customer_id;
    }

    if (name !== undefined) existing.name = name;
    if (description !== undefined) existing.description = description;
    if (active !== undefined) existing.active = active;

    const saved = await repo.save(existing);
    res.json(saved);
  } catch (err) {
    console.error('Error actualizando service:', err);
    res.status(500).json({ message: 'Error actualizando service' });
  }
}

// ====== DELETE /api/services/:id ======
export async function deleteService(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;
    const repo = serviceRepo();
    const existing = await repo.findOneBy({ service_id: id });

    if (!existing) {
      return res.status(404).json({ message: 'Service no encontrado' });
    }

    await repo.remove(existing);
    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando service:', err);
    res.status(500).json({ message: 'Error eliminando service' });
  }
}