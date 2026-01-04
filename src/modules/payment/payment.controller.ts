
import { Request, Response } from 'express';

import { AppDataSource } from '@/config/data-source';

import { Payment } from '@/modules/payment/payment.entity';

import { Customer } from '@/modules/customer/customer.entity';

import {CreatePaymentDto} from '@/modules/payment/create-payment.dto';

import {UpdatePaymentDto} from '@/modules/payment/update-payment.dto';

export async function listPayments(_req: Request, res: Response) 
{
  try {
    const repo = AppDataSource.getRepository(Payment);

    const items = await repo.find();

    const response = items.map((c) => ({
      customer_id: c.customer_id,
      amount: c.amount,
      currency: c.currency,
      method: c.method,
      status: c.status,
      external_ref: c.external_ref,
    }));

    res.json(response);
  } catch (err) {
    console.error('Error listando payments:', err);
    res.status(500).json({ message: 'Error listando payments' });
  }
}

export async function getPayment(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Payment);

    const item = await repo.findOneBy({ payment_id: id });

    if (!item) {
      return res.status(404).json({ message: 'Payment no encontrado' });
    }

    const response = 
    {
      customer_id: item.customer_id,
      amount: item.amount,
      currency: item.currency,
      method: item.method,
      status: item.status,
      external_ref: item.external_ref,
    };

    res.json(response);
  } catch (err) {
    console.error('Error obteniendo payment:', err);
    res.status(500).json({ message: 'Error obteniendo payment' });
  }
}

export async function createPayment(req: Request<{}, {}, CreatePaymentDto>, res: Response) 
{
  try {
    const { customer_id, amount, currency, method, status, external_ref } =
      req.body ?? {};

    if (!customer_id || !amount || !currency || !method || !status || !external_ref) 
    {
      return res.status(400).json({
        message:
          'customer_id, amount, currency, method, status, external_ref son requeridos',
      });
    }

    const customerRepo = AppDataSource.getRepository(Customer);
    const exists = await customerRepo.findOneBy({ customer_id });
    if (!exists) {
      return res.status(400).json({ message: 'customer_id no existe' });
    }

    const repo = AppDataSource.getRepository(Payment);

    const entity = repo.create({
      customer_id,
      amount,
      currency,
      method,
      status,
      external_ref,
    });

    const saved = await repo.save(entity);

    const response = 
    {
      customer_id: saved.customer_id,
      amount: saved.amount,
      currency: saved.currency,
      method: saved.method,
      status: saved.status,
      external_ref: saved.external_ref,
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('Error creando payment:', err);
    res.status(500).json({ message: 'Error creando payment' });
  }
}

export async function updatePayment(req: Request<{ id: string }, {}, UpdatePaymentDto>, res: Response) 
{
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Payment);

    const existing = await repo.findOneBy({ payment_id: id });

    if (!existing) {
      return res.status(404).json({ message: 'payment no encontrado' });
    }

    const { customer_id, amount, currency, method, status, external_ref } =
      req.body ?? {};

    if (customer_id !== undefined) {
      const customerRepo = AppDataSource.getRepository(Customer);
      const exists = await customerRepo.findOneBy({ customer_id });
      if (!exists) {
        return res.status(400).json({ message: 'customer_id no existe' });
      }
      (existing as any).customer_id = customer_id;
    }

    if (amount !== undefined) existing.amount = String(amount);
    if (currency !== undefined) existing.currency = currency;
    if (method !== undefined) existing.method = method;
    if (status !== undefined) existing.status = status as any;
    if (external_ref !== undefined) existing.external_ref = external_ref;

    const saved = await repo.save(existing);

    const response = 
    {
      customer_id: saved.customer_id,
      amount: saved.amount,
      currency: saved.currency,
      method: saved.method,
      status: saved.status,
      external_ref: saved.external_ref,
    };

    res.json(response);
  } catch (err) {
    console.error('Error actualizando payment:', err);
    res.status(500).json({ message: 'Error actualizando payment' });
  }
}

export async function deletePayment(req: Request<{ id: string }>, res: Response) 
{
  try {

    const repo = AppDataSource.getRepository(Payment);

    const existing = await repo.findOneBy({ payment_id: req.params.id });

    if (!existing) {
      return res.status(404).json({ message: 'Payment no encontrado' });
    }

    await repo.remove(existing);

    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando payment:', err);
    res.status(500).json({ message: 'Error eliminando payment' });
  }
}