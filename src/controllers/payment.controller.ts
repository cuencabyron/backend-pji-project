import { Request, Response } from 'express';
import { paymentRepo } from '../repositories/payment.repo';

type PaymentBody = {
  amount: number; // viene como número, se convertirá a string/decimal
  currency: string;
  method: string; 
  status: string;
  external_ref: string;
};

// GET /api/payments
export async function listPayments(_req: Request, res: Response) {
  const repo = paymentRepo();
  const items = await repo.find();
  res.json(items);
}

// GET /api/payments/:id
export async function getPayment(req: Request<{ id: string }>, res: Response) {
  const repo = paymentRepo();
  const item = await repo.findOneBy({ payment_id: req.params.id });
  if (!item) return res.status(404).json({ message: 'Payment no encontrado' });
  res.json(item);
}

// POST /api/payments
export async function createPayment(
  req: Request<unknown, unknown, PaymentBody>,
  res: Response
) {
  const { amount, currency, method, status, external_ref} = req.body ?? {};
  if (!amount || !currency || !method  || !status || !external_ref)
    return res.status(400).json({ message: 'amount, currency, method, status, external_ref son requeridos' });

  const repo = paymentRepo();
  const entity = repo.create({ amount: String(amount), currency, method, status, external_ref });
  const saved = await repo.save(entity);
  res.status(201).json(saved);
}

// PUT /api/verifications/:id
export async function updatePayment(
  req: Request<{ id: string }, unknown, Partial<PaymentBody>>,
  res: Response
) {
  const repo = paymentRepo();
  const existing = await repo.findOneBy({ payment_id: req.params.id });
  if (!existing) return res.status(404).json({ message: 'payment no encontrado' });

  const { amount, currency, method, status, external_ref } = req.body ?? {};
  if (amount !== undefined) existing.amount = String(amount);
  if (currency !== undefined) existing.currency = currency;
  if (method !== undefined) existing.method = method;
  if (status !== undefined) existing.status = status;
  if (external_ref !== undefined) existing.external_ref = external_ref;

  const saved = await repo.save(existing);
  res.json(saved);
}

// DELETE /api/payments/:id
export async function deletePayment(req: Request<{ id: string }>, res: Response) {
  const repo = paymentRepo();
  const existing = await repo.findOneBy({ payment_id: req.params.id });
  if (!existing) return res.status(404).json({ message: 'Payment no encontrado' });

  await repo.remove(existing);
  res.status(204).send();
}