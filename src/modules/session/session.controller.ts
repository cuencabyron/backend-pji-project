import { Request, Response } from 'express';
import {
  findAllSessions,
  findSessionById,
  createSessionService,
  updateSessionService,
  deleteSessionService,
} from '@/modules/session/session.service';

export async function listSessions(_req: Request, res: Response) {
  try {
    const items = await findAllSessions();
    res.json(items);
  } catch (err) {
    console.error('Error listando sessions:', err);
    res.status(500).json({ message: 'Error listando sessions' });
  }
}

export async function getSession(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const { id } = req.params;
    const item = await findSessionById(id);

    if (!item) {
      return res.status(404).json({ message: 'Session no encontrada' });
    }

    res.json(item);
  } catch (err) {
    console.error('Error obteniendo session:', err);
    res.status(500).json({ message: 'Error obteniendo session' });
  }
}

export async function createSession(req: Request, res: Response) {
  try {
    const { customer_id, ip_address, user_agent, active } = req.body ?? {};

    if (!customer_id || !ip_address || !user_agent) {
      return res.status(400).json({
        message: 'customer_id, ip_address y user_agent son requeridos',
      });
    }

    const saved = await createSessionService({
      customer_id,
      ip_address,
      user_agent,
      active,
    });

    res.status(201).json(saved);
  } catch (err: any) {
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res
        .status(400)
        .json({ message: 'customer_id no existe en la BD' });
    }

    console.error('Error creando session:', err);
    res.status(500).json({ message: 'Error creando session' });
  }
}

export async function updateSession(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const { id } = req.params;
    const { customer_id, ip_address, user_agent, active } = req.body ?? {};

    const updated = await updateSessionService(id, {
      customer_id,
      ip_address,
      user_agent,
      active,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Session no encontrada' });
    }

    res.json(updated);
  } catch (err: any) {
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res
        .status(400)
        .json({ message: 'customer_id no existe en la BD' });
    }

    console.error('Error actualizando session:', err);
    res.status(500).json({ message: 'Error actualizando session' });
  }
}

export async function deleteSession(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const { id } = req.params;
    const deleted = await deleteSessionService(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Session no encontrada' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando session:', err);
    res.status(500).json({ message: 'Error eliminando session' });
  }
}
