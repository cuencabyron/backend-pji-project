/** Servicios (capa de negocio) para la entidad Customer.
 *    Aquí se implementa la lógica de acceso a datos y reglas básicas de negocio
 *    relacionadas con clientes (Customer), utilizando TypeORM.
 *  Estos servicios NO conocen nada de HTTP (ni Request, ni Response).
 *  Son funciones reutilizables que:
 *    - Hablan con la base de datos mediante AppDataSource.getRepository(Customer).
 *    - Reciben DTOs (CreateCustomerDto, UpdateCustomerDto).
 *    - Devuelven entidades o valores simples (Customer, null, número de filas afectadas).
 *  El controller será el responsable de:
 *    - Interpretar el resultado (por ejemplo, null → 404).
 *    - Traducir errores o estados a códigos HTTP (200, 201, 404, 500, etc.).
 */

// DataSource de TypeORM ya configurado (host, usuario, password, entidades, etc.).
import { AppDataSource } from '@/config/data-source';

// Entidad que mapea la tabla "customer" en la base de datos.
import { Customer } from '@/modules/customer/customer.entity';

// DTO que define la forma esperada de los datos para CREAR un customer.
import { CreateCustomerDto } from '@/modules/customer/dtos/create-customer.dto';

// DTO que define la forma esperada de los datos para ACTUALIZAR un customer.
import { UpdateCustomerDto } from '@/modules/customer/dtos/update-customer.dto';

// Entidad que mapea la tabla "payment" en la base de datos.
import { Payment } from '@/modules/payment/payment.entity';


/** Normaliza un número de teléfono:
 *    - Elimina espacios, guiones y paréntesis.
 *    - Deja solo dígitos y el signo + inicial (si existiera).
 *  Ejemplos:
 *    "55 1234-5678"  -> "5512345678"
 *    "+52 (55) 1234-5678" -> "+525512345678"
 */
export function normalizePhone(rawPhone: string): string 
{
  if (!rawPhone) return rawPhone;
  const trimmed = rawPhone.trim();

  // Si comienza con '+', lo conservamos y limpiamos el resto
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replaceAll(/\D/g, '');
    return `+${digits}`;
  }

  // Si no tiene '+', dejamos únicamente dígitos
  return trimmed.replaceAll(/\D/g, '');
}

/** Obtiene todos los customers de la base de datos.
 *  No aplica lógica de negocio, solo lectura.
 */
export async function findAllCustomers(): Promise<Customer[]> 
{
  // Obtiene el repositorio de la entidad Customer.
  const repo = AppDataSource.getRepository(Customer);

  // Ejecuta una consulta a la base de datos para traer *todos* los registros
  // de la tabla "customer" y los devuelve como un arreglo de entidades Customer.
  const items = await repo.find();

  // Retorna el arreglo de customers al caller (por ejemplo, el controller),
  // que será quien decida cómo convertirlos a JSON y qué respuesta HTTP enviar.
  return items
}

/** Busca un customer por su ID (UUID).
 *  Si no existe, devuelve null. El controller decide si responde 404.
 */
export async function findCustomerById(id: string): Promise<Customer | null> 
{
  // Obtiene el repositorio de la entidad Customer.
  const repo = AppDataSource.getRepository(Customer);

  // Busca en la base de datos un registro cuyo campo "customer_id"
  // coincida exactamente con el valor recibido en el parámetro `id`.
  // - Si lo encuentra, devuelve una instancia de Customer.
  // - Si no lo encuentra, devuelve null.
  const customer = await repo.findOneBy({ customer_id: id });

  // Retorna el resultado al caller (por ejemplo, el controller).
  // Será el controller quien decida:
  //   - si `customer === null` → responder 404
  //   - si `customer` tiene valor → devolverlo como JSON con 200 OK
  return customer;
}

/** Crea un nuevo customer en la base de datos a partir de un DTO de creación aplicando reglas de negocio:
 *    - Normaliza el teléfono.
 *    - Verifica que no exista ya otro customer con el mismo email.
 *  Si el email ya está en uso, lanza un Error con mensaje 'EMAIL_IN_USE'.
 *  El controller puede capturar esto y responder 409 (Conflict), por ejemplo.
 */
export async function createCustomerService(dto: CreateCustomerDto,): Promise<Customer> 
{
  // Obtiene el repositorio de la entidad Customer.
  const repo = AppDataSource.getRepository(Customer);

  // 1) Normalizar teléfono
  const normalizedPhone = normalizePhone(dto.phone);

  // 2) Verificar email único
  const existingWithSameEmail = await repo.findOne({
    where: { email: dto.email },
  });

  if (existingWithSameEmail) {
    // Regla de negocio: email único
    // El controller debería detectar este mensaje para devolver 409 en vez de 500.
    const error = new Error('EMAIL_IN_USE');
    // Opcional: añadir una propiedad code para identificarlo mejor
    (error as any).code = 'EMAIL_IN_USE';
    throw error;
  }

  // 3) Crear entidad y guardar
  const entity = repo.create({
    ...dto,
    phone: normalizedPhone,
  });

  const saved = await repo.save(entity);
  return saved;
}

/** Actualiza parcialmente un customer existente a partir de un DTO de actualización.
 *  Reglas de negocio:
 *    - Si el email cambia, se verifica que no haya otro customer con ese email.
 *    - Si viene teléfono en el DTO, se normaliza antes de guardar.
 *  Si el customer no existe → devuelve null.
 *  Si el email propuesto ya está usado por otro customer → lanza Error 'EMAIL_IN_USE'.
 */
export async function updateCustomerService(id: string, dto: UpdateCustomerDto,): Promise<Customer | null> 
{
  // Obtiene el repositorio de la entidad Customer.
  const repo = AppDataSource.getRepository(Customer);

  // 1) Buscar registro actual
  const existing = await repo.findOneBy({ customer_id: id });
  if (!existing) {
    return null; // el controller decide responder 404
  }

  // 2) Si viene un email en el DTO y es diferente del actual, validar unicidad
  if (dto.email && dto.email !== existing.email) 
  {
    const otherWithSameEmail = await repo.findOne({
      where: { email: dto.email },
    });

    if (otherWithSameEmail) {
      const error = new Error('EMAIL_IN_USE');
      (error as any).code = 'EMAIL_IN_USE';
      throw error;
    }
  }

  // 3) Si viene teléfono, normalizar
  if (dto.phone) {
    dto.phone = normalizePhone(dto.phone);
  }

  // 4) Actualizar campos (solo los que vienen definidos)
  Object.assign(existing, dto);

  const saved = await repo.save(existing);

  return saved;
}

/** Elimina un customer por su ID.
 *  Reglas de negocio:
 *      - Si el customer tiene pagos pendientes (por ejemplo 'pending'),
 *        NO se permite borrar y se lanza un Error con código 'CUSTOMER_HAS_ACTIVE_PAYMENTS'.
 *  Devuelve:
 *      - número de filas afectadas (0 si no existía, 1 si se borró).
 */
export async function deleteCustomerService(id: string): Promise<number> 
{
  // Obtiene el repositorio de la entidad Customer.
  const customerRepo = AppDataSource.getRepository(Customer);

  // Obtiene el repositorio de la entidad relacionada (Payment).
  const paymentRepo = AppDataSource.getRepository(Payment);

  // 1) Verificar si el customer existe
  const customer = await customerRepo.findOneBy({ customer_id: id });
  if (!customer) {
    return 0; // el controller puede responder 404
  }

  // 2) Verificar si tiene pagos activos
  const activePaymentsCount = await paymentRepo.count({
    where: {
      customer_id: id,
      status: 'pending'
    },
  });

  if (activePaymentsCount > 0) {
    const error = new Error('CUSTOMER_HAS_ACTIVE_PAYMENTS');
    (error as any).code = 'CUSTOMER_HAS_ACTIVE_PAYMENTS';
    throw error;
  }

  // 3) Si pasa las validaciones, borrar
  const result = await customerRepo.delete({ customer_id: id });
  return result.affected ?? 0;
}

//"start": "node -r tsconfig-paths/register dist/server.ts",