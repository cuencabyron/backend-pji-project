// src/modules/service/service.controller.ts

import { Request, Response } from 'express';

import {
  findAllServices,
  findServiceById,
  createServiceService,
  updateServiceService,
  deleteServiceService,
} from '@/modules/service/service.service';

/**
 * GET /api/services
 */
export async function listServices(_req: Request, res: Response) {
  try {
    const items = await findAllServices();
    res.json(items);
  } catch (err) {
    console.error('Error listando services:', err);
    res.status(500).json({ message: 'Error listando services' });
  }
}

/**
 * GET /api/services/:id
 */
export async function getService(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const { id } = req.params;
    const item = await findServiceById(id);

    if (!item) {
      return res.status(404).json({ message: 'Service no encontrado' });
    }

    res.json(item);
  } catch (err) {
    console.error('Error obteniendo service:', err);
    res.status(500).json({ message: 'Error obteniendo service' });
  }
}

/**
 * POST /api/services
 */
export async function createService(req: Request, res: Response) {
  try {
    const { customer_id, name, description, active } = req.body ?? {};

    if (!customer_id || !name || !description) {
      return res.status(400).json({
        message: 'customer_id, name y description son requeridos',
      });
    }

    const saved = await createServiceService({
      customer_id,
      name,
      description,
      active,
    });

    res.status(201).json(saved);
  } catch (err: any) {
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res
        .status(400)
        .json({ message: 'customer_id no existe en la BD' });
    }

    console.error('Error creando service:', err);
    res.status(500).json({ message: 'Error creando service' });
  }
}

/**
 * PUT /api/services/:id
 */
export async function updateService(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const { id } = req.params;
    const { customer_id, name, description, active } = req.body ?? {};

    const updated = await updateServiceService(id, {
      customer_id,
      name,
      description,
      active,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Service no encontrado' });
    }

    res.json(updated);
  } catch (err: any) {
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res
        .status(400)
        .json({ message: 'customer_id no existe en la BD' });
    }

    console.error('Error actualizando service:', err);
    res.status(500).json({ message: 'Error actualizando service' });
  }
}

/**
 * DELETE /api/services/:id
 */
export async function deleteService(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const { id } = req.params;
    const deleted = await deleteServiceService(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Service no encontrado' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando service:', err);
    res.status(500).json({ message: 'Error eliminando service' });
  }
}