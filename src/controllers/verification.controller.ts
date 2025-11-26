import { Request, Response } from 'express';
import { verificationRepo } from '../repositories/verification.repo';

type VerificationBody = {
  type: string;
  status: string;
  attempts: number; 
};

// GET /api/verifications
export async function listVerifications(_req: Request, res: Response) {
  const repo = verificationRepo();
  const items = await repo.find();
  res.json(items);
}

// GET /api/verifications/:id
export async function getVerification(req: Request<{ id: string }>, res: Response) {
  const repo = verificationRepo();
  const item = await repo.findOneBy({ verification_id: req.params.id });
  if (!item) return res.status(404).json({ message: 'Verification no encontrado' });
  res.json(item);
}

// POST /api/verifications
export async function createVerification(
  req: Request<unknown, unknown, VerificationBody>,
  res: Response
) {
  const { type, status, attempts} = req.body ?? {};
  if (!type || !status || !attempts)
    return res.status(400).json({ message: 'type, status y attempts son requeridos' });

  const repo = verificationRepo();
  const entity = repo.create({ 
    type, 
    status, 
    attempts});
  const saved = await repo.save(entity);
  res.status(201).json(saved);
}

// PUT /api/verifications/:id
export async function updateVerification(
  req: Request<{ id: string }, unknown, Partial<VerificationBody>>,
  res: Response
) {
  const repo = verificationRepo();
  const existing = await repo.findOneBy({ verification_id: req.params.id });
  if (!existing) return res.status(404).json({ message: 'Verification no encontrado' });

  const { type, status, attempts} = req.body ?? {};
  if (type !== undefined) existing.type = type;
  if (status !== undefined) existing.status = status;
  if (attempts !== undefined) existing.attempts = attempts;

  const saved = await repo.save(existing);
  res.json(saved);
}

// DELETE /api/verifications/:id
export async function deleteVerification(req: Request<{ id: string }>, res: Response) {
  const repo = verificationRepo();
  const existing = await repo.findOneBy({ verification_id: req.params.id });
  if (!existing) return res.status(404).json({ message: 'Verification no encontrado' });

  await repo.remove(existing);
  res.status(204).send();
}