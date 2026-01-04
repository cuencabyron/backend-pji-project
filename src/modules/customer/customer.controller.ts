
import { Request, Response } from 'express';

import { AppDataSource } from '@/config/data-source';

import { Customer } from '@/modules/customer/customer.entity';

import {CreateCustomerDto} from '@/modules/customer/create-customer.dto';

import {UpdateCustomerDto} from '@/modules/customer/update-customer.dto';


export async function listCustomers(_req: Request, res: Response) 
{
  try {
    const repo = AppDataSource.getRepository(Customer);

    const items = await repo.find();

    const response = items.map((c) => ({
      customer_id: c.customer_id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      active: c.active,
    }));

    res.json(response);
  } catch (err) {
    console.error('Error listando customers:', err);
    res.status(500).json({ message: 'Error listando customers' });
  }
}


export async function getCustomer(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Customer);

    const item = await repo.findOneBy({ customer_id: id });

    if (!item) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }

    const response = 
    {
      customer_id: item.customer_id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      active: item.active,
    };

    res.json(response);
  } catch (err) {
    console.error('Error obteniendo customer:', err);
    res.status(500).json({ message: 'Error obteniendo customer' });
  }
}

export async function createCustomer(req: Request<{}, {}, CreateCustomerDto>, res: Response) 
{
  try {
    const { name, email, phone, address, active = true } = req.body ?? {};

    if (!name || !email || !phone || !address) 
    {
      return res
        .status(400)
        .json({ message: 'name, email, phone, address son requeridos' });
    }

    const repo = AppDataSource.getRepository(Customer);

    const entity = repo.create({ name, email, phone, address, active });

    const saved = await repo.save(entity);

    const response = 
    {
      customer_id: saved.customer_id,
      name: saved.name,
      email: saved.email,
      phone: saved.phone,
      address: saved.address,
      active: saved.active,
    };

    // Devuelve el recurso recién creado con código 201.
    res.status(201).json(response);
  } catch (err) {
    console.error('Error creando customer:', err);
    res.status(500).json({ message: 'Error creando customer' });
  }
}


export async function updateCustomer(req: Request<{ id: string }, {}, UpdateCustomerDto>, res: Response) 
{
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Customer);

    const existing = await repo.findOneBy({ customer_id: id });

    if (!existing) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }

    const { name, email, phone, address, active } = req.body ?? {};

    if (name !== undefined) existing.name = name;
    if (email !== undefined) existing.email = email;
    if (phone !== undefined) existing.phone = phone;
    if (address !== undefined) existing.address = address;
    if (active !== undefined) existing.active = active;

    const saved = await repo.save(existing);

    const response = 
    {
      customer_id: saved.customer_id,
      name: saved.name,
      email: saved.email,
      phone: saved.phone,
      address: saved.address,
      active: saved.active,
    };

    res.json(response);
  } catch (err) {
    console.error('Error actualizando customer:', err);
    res.status(500).json({ message: 'Error actualizando customer' });
  }
}


export async function deleteCustomer(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Customer);

    const existing = await repo.findOneBy({ customer_id: id });

    if (!existing) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }

    await repo.remove(existing);

    return res.status(204).send();
  } catch (err) {
    console.error('Error eliminando customer:', err);
    return res.status(500).json({ message: 'Error eliminando customer' });
  }
}