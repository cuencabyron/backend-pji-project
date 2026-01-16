import { Request, Response } from 'express';

import {
  findAllProducts,
  findProductById,
  createProductService,
  updateProductService,
  deleteProductService,
} from '@/modules/product/product.service';


export async function listProducts(_req: Request, res: Response) 
{
  try {
    const items = await findAllProducts();
    res.json(items);
  } catch (err) {
    console.error('Error listando products:', err);
    res.status(500).json({ message: 'Error listando products' });
  }
}


export async function getProduct(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;
    const item = await findProductById(id);

    if (!item) {
      return res.status(404).json({ message: 'Product no encontrado' });
    }

    res.json(item);
  } catch (err) {
    console.error('Error obteniendo product:', err);
    res.status(500).json({ message: 'Error obteniendo product' });
  }
}


export async function createProduct(req: Request, res: Response) 
{
  try {
    const { customer_id, name, description, min_monthly_rent, max_monthly_rent, active } = req.body ?? {};

    if (!customer_id || !name || !description || min_monthly_rent! || max_monthly_rent!) {
      return res.status(400).json({
        message: 'customer_id, name y description son requeridos',
      });
    }

    const saved = await createProductService({
      customer_id,
      name,
      description,
      min_monthly_rent,
      max_monthly_rent,
      active,
    });

    res.status(201).json(saved);
  } catch (err: any) {
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res
        .status(400)
        .json({ message: 'customer_id no existe en la BD' });
    }

    console.error('Error creando product:', err);
    res.status(500).json({ message: 'Error creando product' });
  }
}


export async function updateProduct(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;
    const { customer_id, name, description, min_monthly_rent, max_monthly_rent, active } = req.body ?? {};

    const updated = await updateProductService(id, {
      customer_id,
      name,
      description,
      min_monthly_rent,
      max_monthly_rent,
      active,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Product no encontrado' });
    }

    res.json(updated);
  } catch (err: any) {
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res
        .status(400)
        .json({ message: 'customer_id no existe en la BD' });
    }

    console.error('Error actualizando product:', err);
    res.status(500).json({ message: 'Error actualizando product' });
  }
}


export async function deleteProduct(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;
    const deleted = await deleteProductService(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Product no encontrado' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando product:', err);
    res.status(500).json({ message: 'Error eliminando product' });
  }
}