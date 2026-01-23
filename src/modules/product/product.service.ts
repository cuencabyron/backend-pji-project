// Importa el DataSource configurado (TypeORM) para poder obtener repositorios y ejecutar queries.
import { AppDataSource } from '@/config/data-source';

// Importa la entidad Product (tabla/colección Product en la BD).
import { Product } from '@/modules/product/product.entity';

// Importa la entidad Customer (relación: Product pertenece a Customer).
import { Customer } from '@/modules/customer/customer.entity';

// Importa el DTO de creación: define la forma/validación del payload al crear un producto.
import { CreateProductDto } from '@/modules/product/dtos/create-product.dto';

// Importa el DTO de actualización: define la forma/validación del payload al actualizar un producto.
import { UpdateProductDto } from '@/modules/product/dtos/update-product.dto';

// Lista todos los productos incluyendo la relación con customer.
export async function findAllProducts() 
{
  // Obtiene el repositorio TypeORM de Product para hacer operaciones CRUD.
  const repo = AppDataSource.getRepository(Product);

  // Retorna todos los productos (repo.find) incluyendo la relación customer.
  // relations: { customer: true } fuerza a TypeORM a hacer el join/carga de la relación.
  return repo.find({
    relations: { customer: true },
  });
}

// Busca un producto por su ID, incluyendo su customer relacionado.
export async function findProductById(id: string) 
{
  // Obtiene el repositorio de Product.
  const repo = AppDataSource.getRepository(Product);

  // Busca uno por condición where usando el campo product_id.
  // También carga la relación customer.
  return repo.findOne({
    where: { product_id: id },
    relations: { customer: true },
  });
}

// Crea un producto nuevo validando previamente que el customer exista.
export async function createProductService(dto: CreateProductDto) 
{
  // Repositorio de Product para crear/guardar.
  const productRepo = AppDataSource.getRepository(Product);

  // Repositorio de Customer para validar el customer_id entrante.
  const customerRepo = AppDataSource.getRepository(Customer);

  // Busca el customer al que se asociará el producto.
  const customer = await customerRepo.findOneBy({
    // Busca por PK/UUID del customer.
    customer_id: dto.customer_id,
  });

  // Si no existe customer, se lanza un error tipificado con code.
  // El controller interpreta error.code para mapearlo a un status HTTP (normalmente 400).
  if (!customer) {
    // Crea un Error estándar.
    const error: any = new Error('Customer no encontrado');

    // Agrega un código custom para que el controller distinga el caso.
    error.code = 'CUSTOMER_NOT_FOUND';

    // Lanza el error para cortar el flujo.
    throw error;
  }

  // Crea una entidad Product a partir del DTO (sin persistir todavía).
  // productRepo.create NO escribe en BD; solo construye la instancia con el mapping.
  const entity = productRepo.create({
    // Copia campos simples desde el DTO.
    name: dto.name,
    description: dto.description,
    min_monthly_rent: dto.min_monthly_rent,
    max_monthly_rent: dto.max_monthly_rent,

    // active: si dto.active viene null/undefined, se usa true por defecto.
    active: dto.active ?? true,

    // Asigna la relación: el product queda asociado al customer encontrado.
    // Esto asume que Product tiene una relación ManyToOne hacia Customer.
    customer,
  });

  // Persiste la entidad en base de datos.
  const saved = await productRepo.save(entity);

  // Retorna el registro ya guardado (incluye id generado y valores finales).
  return saved;
}

// Actualiza un producto existente.
// - Si no existe, retorna null (para que el controller responda 404).
// - Si dto.customer_id se envía, valida que el nuevo customer exista (si no, lanza CUSTOMER_NOT_FOUND).
export async function updateProductService(id: string, dto: UpdateProductDto) 
{
  // Repositorio de Product para buscar y guardar cambios.
  const productRepo = AppDataSource.getRepository(Product);

  // Repositorio de Customer para validar reasignación de customer_id (si aplica).
  const customerRepo = AppDataSource.getRepository(Customer);

  // Busca el producto actual por id, cargando su customer para mantener consistencia.
  const existing = await productRepo.findOne({
    where: { product_id: id },
    relations: { customer: true },
  });

  // Si no existe el producto, retorna null (no lanza error).
  // El controller normalmente traduce null a 404 Not Found.
  if (!existing) {
    return null;
  }

  // Si viene customer_id en el DTO, se intenta reasignar el producto a otro customer.
  if (dto.customer_id) {
    // Busca el nuevo customer por id.
    const newCustomer = await customerRepo.findOneBy({
      customer_id: dto.customer_id,
    });

    // Si no existe el customer nuevo, lanza error tipificado.
    if (!newCustomer) {
      const error: any = new Error('Customer no encontrado');
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }

    // Reasigna la relación customer del producto.
    existing.customer = newCustomer;
  }

  // Actualiza campo por campo solo si el DTO lo trae (evita pisar con undefined).
  if (dto.name !== undefined) existing.name = dto.name;
  if (dto.description !== undefined) existing.description = dto.description;
  if (dto.min_monthly_rent !== undefined) existing.min_monthly_rent = dto.min_monthly_rent;
  if (dto.max_monthly_rent !== undefined) existing.max_monthly_rent = dto.max_monthly_rent;
  if (dto.active !== undefined) existing.active = dto.active;

  // Guarda los cambios en BD.
  const saved = await productRepo.save(existing);

  // Retorna el producto actualizado.
  return saved;
}

// Elimina un producto por id y retorna el número de filas afectadas.
// Esto permite que el controller responda:
// - 204 si affected > 0
// - 404 si affected === 0
export async function deleteProductService(id: string) 
{
  // Obtiene el repositorio de Product.
  const repo = AppDataSource.getRepository(Product);

  // Ejecuta el delete por condición. No retorna la entidad, retorna DeleteResult.
  const result = await repo.delete({ product_id: id });

  // result.affected puede ser undefined según el driver; por eso se normaliza a 0.
  return result.affected ?? 0;
}