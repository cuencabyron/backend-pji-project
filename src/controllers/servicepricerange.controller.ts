/*
import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { rangeRepo } from '../repositories/servicepricerange.repo'; // crea esta factory getRepository(ServicePriceRange)
import { Service } from '../entities/Service';
import { ServicePriceRange } from '../entities/ServicePriceRange';

type RangeBody = {
  service_id?: string;
  min_monthly_rent?: number;
  max_monthly_rent?: number | null;
  annual_price?: number;
  currency?: string;
  note?: string | null;
};

// GET /api/ranges
export async function listRanges(_req: Request, res: Response) {
  try {
    const repo = rangeRepo();
    const items = await repo.find({
      relations: { service: true },
      order: { created_at: 'DESC' as const },
    });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error listando ranges' });
  }
}

// GET /api/ranges/:id
export async function getRange(req: Request<{ id: string }>, res: Response) 
{
  try {
    const repo = rangeRepo();
    const item = await repo.findOne({
      where: { range_id: req.params.id as any }, // BIGINT -> usa number o string según def
      relations: { service: true },
    });
    if (!item) return res.status(404).json({ message: 'Range no encontrado' });
    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error obteniendo range' });
  }
}

// POST /api/ranges
export async function createRange(
  req: Request<{}, {}, RangeBody>,
  res: Response
) {
  try {
    const { service_id, min_monthly_rent, max_monthly_rent = null, annual_price, currency = 'MXN', note = null } = req.body ?? {};
    if (!service_id || min_monthly_rent == null || annual_price == null) {
      return res.status(400).json({ message: 'service_id, min_monthly_rent y annual_price son requeridos' });
    }

    const service = await AppDataSource.getRepository(Service).findOneBy({ service_id });
    if (!service) return res.status(400).json({ message: 'service_id no existe' });

    // Opcional: validar rango coherente
    if (max_monthly_rent != null && !(max_monthly_rent > min_monthly_rent)) {
      return res.status(400).json({ message: 'max_monthly_rent debe ser > min_monthly_rent o null' });
    }

    const repo = rangeRepo();
    const entity = repo.create({
      service,
      min_monthly_rent: String(min_monthly_rent),
      max_monthly_rent: max_monthly_rent == null ? null : String(max_monthly_rent),
      annual_price: String(annual_price),
      currency,
      note,
    } as Partial<ServicePriceRange>);

    const saved = await repo.save(entity);
    res.status(201).json(saved);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error creando range' });
  }
}

// PUT /api/ranges/:id
export async function updateRange(
  req: Request<{ id: string }, {}, Partial<RangeBody>>,
  res: Response
) {
  try {
    const { id } = req.params;
    const repo = rangeRepo();
    const existing = await repo.findOne({
      where: { range_id: id as any },
      relations: { service: true },
    });
    if (!existing) return res.status(404).json({ message: 'Range no encontrado' });

    const { service_id, min_monthly_rent, max_monthly_rent, annual_price, currency, note } = req.body ?? {};

    if (service_id !== undefined) {
      const service = await AppDataSource.getRepository(Service).findOneBy({ service_id });
      if (!service) return res.status(400).json({ message: 'service_id no existe' });
      (existing as any).service = service;
    }
    if (min_monthly_rent !== undefined) existing.min_monthly_rent = String(min_monthly_rent);
    if (max_monthly_rent !== undefined) existing.max_monthly_rent = max_monthly_rent == null ? null : String(max_monthly_rent);
    if (annual_price !== undefined) existing.annual_price = String(annual_price);
    if (currency !== undefined) existing.currency = currency;
    if (note !== undefined) existing.note = note;

    // Validación coherencia
    const min = Number(existing.min_monthly_rent);
    const max = existing.max_monthly_rent == null ? null : Number(existing.max_monthly_rent);
    if (max != null && !(max > min)) {
      return res.status(400).json({ message: 'max_monthly_rent debe ser > min_monthly_rent o null' });
    }

    const saved = await repo.save(existing);
    res.json(saved);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error actualizando range' });
  }
}

// DELETE /api/ranges/:id
export async function deleteRange(req: Request<{ id: string }>, res: Response) {
  try {
    const repo = rangeRepo();
    const existing = await repo.findOneBy({ range_id: req.params.id as any });
    if (!existing) return res.status(404).json({ message: 'Range no encontrado' });

    await repo.remove(existing);
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error eliminando range' });
  }
}
*/