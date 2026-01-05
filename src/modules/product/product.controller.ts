import { Request, Response } from 'express';

import { AppDataSource } from '@/config/data-source';

import { Product } from '@/modules/product/product.entity';

import { Customer } from '@/modules/customer/customer.entity';

import {CreateProductDto} from '@/modules/product/create-product.dto';

import {UpdateProductDto} from '@/modules/product/update-product.dto';

export async function listProducts(_req: Request, res: Response) 
{
  try {
    const repo = AppDataSource.getRepository(Product);

    const items = await repo.find();

    const response = items.map((c) => ({
      customer_id: c.customer_id,
      name: c.name,
      description: c.description,
      active: c.active,
    }));

    res.json(response);
  } catch (err) {
    console.error('Error listando products:', err);
    res.status(500).json({ message: 'Error listando products' });
  }
}


export async function getProduct(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Product);

    const item = await repo.findOneBy({ product_id: id });

    if (!item) {
      return res.status(404).json({ message: 'Product no encontrado' });
    }

    const response = 
    {
      customer_id: item.customer_id,
      name: item.name,
      description: item.description,
      active: item.active,
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error obteniendo product:', err);
    res.status(500).json({ message: 'Error obteniendo product' });
  }
}


export async function createProduct(req: Request<{}, {}, CreateProductDto>, res: Response) 
{
  try {
    const { customer_id, name, description, active = true } = req.body ?? {};

    if (!customer_id || !name || !description) 
    {
      return res.status(400).json({
        message: 'customer_id, name y description son requeridos',
      });
    }

    const customerRepo = AppDataSource.getRepository(Customer);
    const exists = await customerRepo.findOneBy({ customer_id });
    if (!exists) {
      return res.status(400).json({ message: 'customer_id no existe' });
    }

    const repo = AppDataSource.getRepository(Product);

    const entity = repo.create({ customer_id, name, description, active });

    const saved = await repo.save(entity);

    const response = 
    {
      customer_id: saved.customer_id,
      name: saved.name,
      description: saved.description,
      active: saved.active,
    };

    res.status(201).json(response);
  } catch (err: any) {
    console.error('Error creando product:', err);
    res.status(500).json({ message: 'Error creando product' });
  }
}


export async function updateProduct(req: Request<{ id: string }, {}, UpdateProductDto>, res: Response) 
{
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Product);

    const existing = await repo.findOneBy({ product_id: id });

    if (!existing) {
      return res.status(404).json({ message: 'Product no encontrado' });
    }

    const { customer_id, name, description, active } = req.body ?? {};

    if (customer_id !== undefined) {
      const customerRepo = AppDataSource.getRepository(Customer);
      const exists = await customerRepo.findOneBy({ customer_id });
      if (!exists) {
        return res.status(400).json({ message: 'customer_id no existe' });
      }
      (existing as any).customer_id = customer_id;
    }

    if (name !== undefined) existing.name = name;
    if (description !== undefined) existing.description = description;
    if (active !== undefined) existing.active = active;

    const saved = await repo.save(existing);

    const response = 
    {
      customer_id: saved.customer_id,
      name: saved.name,
      description: saved.description,
      active: saved.active,
    };

    res.json(response);
  } catch (err) {
    console.error('Error actualizando product:', err);
    res.status(500).json({ message: 'Error actualizando product' });
  }
}


export async function deleteProduct(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Product);

    const existing = await repo.findOneBy({ product_id: id });

    if (!existing) {
      return res.status(404).json({ message: 'Product no encontrado' });
    }

    await repo.remove(existing);

    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando product:', err);
    res.status(500).json({ message: 'Error eliminando product' });
  }
}