import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { verificationRepo } from '../repositories/verification.repo';
import { Customer } from '../entities/Customer';
import { Session } from '../entities/Session';
import { Payment } from '../entities/Payment';

type VerificationBody = 
{
  customer_id: string;
  session_id: string;
  payment_id: string;
  type: string;
  status?: 'pending' | 'approved' | 'rejected' | 'expired';
  attempts: number; 
};

// ====== GET /api/verifications ======
export async function listVerifications(_req: Request, res: Response) 
{
  try {
    const repo = verificationRepo();
    const items = await repo.find({
      relations: { customer: true, session: true, payment: true },
      order: { created_at: 'DESC' as const },
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error listando verifications' });
  }
}

// ====== GET /api/verifications/:id =====
export async function getVerification(req: Request<{ id: string }>, res: Response) 
{
  try {
    const repo = verificationRepo();
    const item = await repo.findOne({
      where: { verification_id: req.params.id },
      relations: { customer: true, session: true, payment: true },
    });
    if (!item) return res.status(404).json({ message: 'Verification no encontrado' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error obteniendo verification' });
  }
}

// ====== POST /api/verifications ======
export async function createVerification(req: Request<{}, {}, VerificationBody>, res: Response)
{
  try {
    const { customer_id, session_id, payment_id, type, status, attempts } = req.body ?? {};

    if (!customer_id || !session_id || !payment_id || !type || !status || attempts == null) {
      return res.status(400).json({
        message: 'customer_id, session_id, payment_id, type, status y attempts son requeridos',
      });
    }

    const [customer, session, payment] = await Promise.all([
      AppDataSource.getRepository(Customer).findOneBy({ customer_id }),
      AppDataSource.getRepository(Session).findOneBy({ session_id }),
      AppDataSource.getRepository(Payment).findOneBy({ payment_id }),
    ]);

    if (!customer) return res.status(400).json({ message: 'customer_id no existe' });
    if (!session)  return res.status(400).json({ message: 'session_id no existe' });
    if (!payment)  return res.status(400).json({ message: 'payment_id no existe' });

    const repo = verificationRepo();
    const entity = repo.create({ customer, session, payment, type, status, attempts, });

    const saved = await repo.save(entity);
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creando verification' });
  }
}

// ====== PUT /api/verifications/:id ======
export async function updateVerification(req: Request<{ id: string }, {}, Partial<VerificationBody>>, res: Response) 
{
  try {
    const { id } = req.params;
    const repo = verificationRepo();

    const existing = await repo.findOne({
      where: { verification_id: id },
      relations: { customer: true, session: true, payment: true },
    });
    if (!existing) return res.status(404).json({ message: 'Verification no encontrado' });

    const { customer_id, session_id, payment_id, type, status, attempts } = req.body ?? {};

    if (customer_id !== undefined) {
      const c = await AppDataSource.getRepository(Customer).findOneBy({ customer_id });
      if (!c) return res.status(400).json({ message: 'customer_id no existe' });
      existing.customer = c;
    }

    if (session_id !== undefined) {
      const s = await AppDataSource.getRepository(Session).findOneBy({ session_id });
      if (!s) return res.status(400).json({ message: 'session_id no existe' });
      existing.session = s;
    }

    if (payment_id !== undefined) {
      const p = await AppDataSource.getRepository(Payment).findOneBy({ payment_id });
      if (!p) return res.status(400).json({ message: 'payment_id no existe' });
      existing.payment = p;
    }

    if (type !== undefined) existing.type = type;
    if (status !== undefined) existing.status = status;
    if (attempts !== undefined) existing.attempts = attempts;

    const saved = await repo.save(existing);
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error actualizando verification' });
  }
}

// ====== DELETE /api/verifications/:id ======
export async function deleteVerification(req: Request<{ id: string }>, res: Response) 
{
  try {
    const repo = verificationRepo();
    const existing = await repo.findOneBy({ verification_id: req.params.id });
    if (!existing) return res.status(404).json({ message: 'Verification no encontrado' });

    await repo.remove(existing);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error eliminando verification' });
  }
}