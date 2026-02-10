import { Request, Response } from 'express';
import {
  findAllCustomers,
  findCustomerById,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
} from '@/modules/customer/customer.service';

export async function listCustomers(_req: Request, res: Response) 
{
  try {
    const items = await findAllCustomers();
    res.json(items);
  } catch (err) {
    console.error('Error listando customers:', err);
    res.status(500).json({ message: 'Error listando customers' });
  }
}

export async function getCustomer(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;

    const item = await findCustomerById(id);

    if (!item) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }
    res.json(item);
  } catch (err) {
    console.error('Error obteniendo customer:', err);
    res.status(500).json({ message: 'Error obteniendo customer' });
  }
}

export async function createCustomer(req: Request, res: Response) 
{
  try {
    const { name, email, phone, address, active } = req.body;

    if (!name || !email || !phone || !address) 
    {
      return res.status(400).json({
        message: 'name, email, phone, address son requeridos',
      });
    }

    const saved = await createCustomerService({
      name,
      email,
      phone,
      address,
      active,
    });

    res.status(201).json(saved);
  } catch (err: any) {
    if (
      err?.code === 'EMAIL_IN_USE' ||
      err?.message === 'EMAIL_IN_USE'
    ) {
      return res.status(409).json({
        message: 'El email ya está en uso por otro customer',
      });
    }
    console.error('Error creando customer:', err);
    res.status(500).json({ message: 'Error creando customer' });
  }
}

export async function updateCustomer(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;
    const { name, email, phone, address, active } = req.body;
    const updated = await updateCustomerService(id, 
    {
      name,
      email,
      phone,
      address,
      active,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }
    res.json(updated);
  } catch (err: any) {
    if (
      err?.code === 'EMAIL_IN_USE' ||
      err?.message === 'EMAIL_IN_USE'
    ) {
      return res.status(409).json({
        message: 'El email ya está en uso por otro customer',
      });
    }

    console.error('Error actualizando customer:', err);
    res.status(500).json({ message: 'Error actualizando customer' });
  }
}

export async function deleteCustomer(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;
    const deleted = await deleteCustomerService(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }
    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === 'CUSTOMER_HAS_ACTIVE_PAYMENTS') {
      return res.status(409).json({
        message: 'No se puede eliminar el customer porque tiene pagos activos.',
      });
    }

    console.error('Error eliminando customer:', err);
    return res.status(500).json({ message: 'Error eliminando customer' });
  }
}