import { Request, Response } from 'express';

import { AppDataSource } from '@/config/data-source';

import { Verification } from '@/modules/verification/verification.entity';

import { Customer } from '@/modules/customer/customer.entity';

import { Session } from '@/modules/session/session.entity';

import { Payment } from '@/modules/payment/payment.entity';

import {CreateVerificationDto} from '@/modules/verification/dtos/create-verification.dto';

import {UpdateVerificationDto} from '@/modules/verification/dtos/update-verification.dto';



export async function listVerifications(_req: Request, res: Response) 
{
  try {
    const repo = AppDataSource.getRepository(Verification);

    const items = await repo.find(
    {
      relations: { customer: true, session: true, payment: true },
      order: { created_at: 'DESC' as const },
    });

    res.json(items);
  } catch (err) {
    console.error('Error listando verifications:', err);
    res.status(500).json({ message: 'Error listando verifications' });
  }
}

export async function getVerification(req: Request<{ id: string }>, res: Response) 
{
  try {
    const repo = AppDataSource.getRepository(Verification);

    const item = await repo.findOne({
      where: { verification_id: req.params.id },
      relations: { customer: true, session: true, payment: true },
    });

    if (!item) {
      return res.status(404).json({ message: 'Verification no encontrado',});
    }

    res.json(item);
  } catch (err) {
    const errorId = 'VERIFICATION_GET_ERROR';
    console.error(errorId, err);
    res
      .status(500)
      .json(formatError('Error obteniendo verification', errorId, err));
  }
}

export async function createVerification(req: Request<{}, {}, VerificationBody>, res: Response) 
{
  try {
    const { customer_id, session_id, payment_id, type, status, attempts } =
      req.body ?? {};

    if (!customer_id || !session_id || !payment_id || !type || !status || attempts == null) 
    {
      return res.status(400).json({
        message:
          'customer_id, session_id, payment_id, type, status y attempts son requeridos',
        errorId: 'VERIFICATION_VALIDATION_ERROR',
      });
    }

    const [customer, session, payment] = await Promise.all([
      AppDataSource.getRepository(Customer).findOneBy({ customer_id }),
      AppDataSource.getRepository(Session).findOneBy({ session_id }),
      AppDataSource.getRepository(Payment).findOneBy({ payment_id }),
    ]);

    if (!customer) 
    {
      return res
        .status(400)
        .json({ message: 'customer_id no existe', errorId: 'CUSTOMER_NOT_FOUND' });
    }
    if (!session) 
    {
      return res
        .status(400)
        .json({ message: 'session_id no existe', errorId: 'SESSION_NOT_FOUND' });
    }
    if (!payment) 
    {
      return res
        .status(400)
        .json({ message: 'payment_id no existe', errorId: 'PAYMENT_NOT_FOUND' });
    }

    const repo = AppDataSource.getRepository(Verification);

    const entity = repo.create({
      customer,
      session,
      payment,
      type,
      status,
      attempts,
    });

    const saved = await repo.save(entity);

    res.status(201).json(saved);
  } catch (err: any) {
    const errorId = 'VERIFICATION_CREATE_ERROR';
    console.error(errorId, err);

    const payload = formatError('Error creando verification', errorId, err);
    if (err?.sqlMessage) {
      (payload as any).sqlMessage = err.sqlMessage;
    }

    res.status(500).json(payload);
  }
}

export async function updateVerification(req: Request<{ id: string }, {}, Partial<VerificationBody>>, res: Response) 
{
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Verification);

    const existing = await repo.findOne({
      where: { verification_id: id },
      relations: { customer: true, session: true, payment: true },
    });

    if (!existing) 
    {
      return res.status(404).json({ 
        message: 'Verification no encontrado', 
        errorId: 'VERIFICATION_NOT_FOUND',
      });
    }

    const { customer_id, session_id, payment_id, type, status, attempts } =
      req.body ?? {};

    if (customer_id !== undefined) 
    {
      const c = await AppDataSource.getRepository(Customer).findOneBy({
        customer_id,
      });
      if (!c) {
        return res.status(400).json({ 
          message: 'customer_id no existe',
          errorId: 'CUSTOMER_NOT_FOUND',
        });
      }
      existing.customer = c;
    }

    if (session_id !== undefined) 
    {
      const s = await AppDataSource.getRepository(Session).findOneBy({
        session_id,
      });
      if (!s) {
        return res.status(400).json({ 
          message: 'session_id no existe',
          errorId: 'SESSION_NOT_FOUND',
        });
      }
      existing.session = s;
    }

    if (payment_id !== undefined) 
    {
      const p = await AppDataSource.getRepository(Payment).findOneBy({
        payment_id,
      });
      if (!p) {
        return res.status(400).json({ 
          message: 'payment_id no existe', 
          errorId: 'PAYMENT_NOT_FOUND',
        });
      }
      existing.payment = p;
    }

    if (type !== undefined) existing.type = type;
    if (status !== undefined) existing.status = status;
    if (attempts !== undefined) existing.attempts = attempts;

    const saved = await repo.save(existing);

    res.json(saved);
  } catch (err) {
    const errorId = 'VERIFICATION_UPDATE_ERROR';
    console.error(errorId, err);
    res
      .status(500)
      .json(formatError('Error actualizando verification', errorId, err));
  }
}

export async function deleteVerification(req: Request<{ id: string }>, res: Response) 
{
  try {
    const repo = AppDataSource.getRepository(Verification);

    const existing = await repo.findOneBy({
      verification_id: req.params.id,
    });

    if (!existing) 
    {
      return res.status(404).json({
        message: 'Verification no encontrado',
        errorId: 'VERIFICATION_NOT_FOUND',
      });
    }

    await repo.remove(existing);

    res.status(204).send();
  } catch (err) {
    const errorId = 'VERIFICATION_DELETE_ERROR'
    console.error(errorId, err);
    res
      .status(500)
      .json(formatError('Error eliminando verification', errorId, err));
  }
}