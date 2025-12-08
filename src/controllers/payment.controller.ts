import { Request, Response } from 'express';
import { paymentRepo } from '../repositories/payment.repo';
import { AppDataSource } from '../data-source';
import { Customer } from '../entities/Customer';

type PaymentBody = 
{
  customer_id: string;
  amount: string;
  currency: string;
  method: string;
  status?: 'pending' | 'paid' | 'failed' | 'refunded';
  external_ref: string;
};

// ====== GET /api/payments ======
export async function listPayments(_req: Request, res: Response) 
{
  try {
    const repo = paymentRepo();
    const items = await repo.find();
    res.json(items);
  } catch (err) {
    console.error('Error listando payments:', err);
    res.status(500).json({ message: 'Error listando payments' });
  }
}

// ====== GET /api/payments/:id ======
export async function getPayment(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;
    const repo = paymentRepo();
    const item = await repo.findOneBy({ payment_id: id });

    if (!item) {
      return res.status(404).json({ message: 'Payment no encontrado' });
    }

    res.json(item);
  } catch (err) {
    console.error('Error obteniendo payment:', err);
    res.status(500).json({ message: 'Error obteniendo payment' });
  }
}

// ====== POST /api/payments ======
export async function createPayment(req: Request<{}, {}, PaymentBody>, res: Response) 
{
  try {
    const { customer_id, amount, currency, method, status, external_ref } =
      req.body ?? {};

    if (!customer_id || !amount || !currency || !method || !status || !external_ref) {
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

    const repo = paymentRepo();
    const entity = repo.create({
      customer_id,
      amount,
      currency,
      method,
      status,
      external_ref,
    });
    const saved = await repo.save(entity);
    res.status(200).json(saved);
  } catch (err) {
    console.error('Error creando payment:', err);
    res.status(500).json({ message: 'Error creando payment' });
  }
}

// ====== PUT /api/payments/:id ======
export async function updatePayment(req: Request<{ id: string }, {}, Partial<PaymentBody>>, res: Response) 
{
  try {
    const { id } = req.params;
    const repo = paymentRepo();
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
    res.json(saved);
  } catch (err) {
    console.error('Error actualizando payment:', err);
    res.status(500).json({ message: 'Error actualizando payment' });
  }
}

// ====== DELETE /api/payments/:id ======
export async function deletePayment(req: Request<{ id: string }>, res: Response) 
{
  try {
    const repo = paymentRepo();
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