/** 
 * Servicios (capa de negocio) para la entidad Payment.
 *
 * Aquí no se maneja HTTP ni `Request`/`Response`. Estas funciones:
 *   - Usan TypeORM (AppDataSource) para acceder a la base de datos.
 *   - Trabajan con las entidades `Payment` y `Customer`.
 *   - Aplican reglas de negocio básicas (por ejemplo:
 *       - verificar que exista el `Customer` antes de crear/actualizar un Payment
 *       - lanzar errores con `code` específico cuando algo no se puede cumplir).
 *
 * Normalmente son llamadas desde los controladores (controllers), que se encargan
 * de traducir estos errores y resultados a respuestas HTTP (200, 201, 400, 404, 409, 500, etc.).
 */

// DataSource de TypeORM ya configurado (host, usuario, password, entidades, etc.).
import { AppDataSource } from '@/config/data-source';

// Entidad que mapea la tabla "payment" en la base de datos.
import { Payment } from '@/modules/payment/payment.entity';

// Entidad que mapea la tabla "customer" en la base de datos.
import { Customer } from '@/modules/customer/customer.entity';

// DTO que define la forma esperada de los datos para CREAR un payment.
import { CreatePaymentDto } from '@/modules/payment/dtos/create-payment.dto';

// DTO que define la forma esperada de los datos para ACTUALIZAR un payment.
import { UpdatePaymentDto } from '@/modules/payment/dtos/update-payment.dto';

/** 
 * Obtiene todos los payments de la base de datos.
 *
 * - Usa el repositorio de Payment de TypeORM.
 * - Incluye la relación `customer` para que en el resultado venga
 *   tanto la información del pago como los datos del cliente asociado.
 *
 * Se suele usar desde el controller para responder a:
 *   GET /api/payments
 */
export async function findAllPayments() 
{
  // Obtiene el repositorio de la entidad Payment.
  const repo = AppDataSource.getRepository(Payment);

  // Devuelve la lista de payments, cargando también la relación con customer.
  return repo.find({
    relations: { customer: true },
  });
}

/** 
 * Busca un payment por su ID (UUID).
 *
 * - Recibe el `id` del payment (UUID).
 * - Carga también los datos del `customer` asociado (relations: { customer: true }).
 * - Devuelve:
 *    - El Payment encontrado (con el customer) o
 *    - `null` si no existe.
 *
 * Se usa normalmente en el controller para:
 *   GET /api/payments/:id
 */
export async function findPaymentById(id: string) 
{
  // Obtiene el repositorio de la entidad Payment.
  const repo = AppDataSource.getRepository(Payment);

  /* Busca un único registro cuyo payment_id coincida con el id recibido.
  Además, `relations: { customer: true }` indica a TypeORM que también
  cargue los datos del Customer relacionado (JOIN en la consulta).*/
  return repo.findOne({
    where: { payment_id: id },
    relations: { customer: true },
  });
}

/** 
 * Crea un nuevo payment en la base de datos a partir de un DTO de creación.
 *
 * Flujo:
 *   1. Recibe un `CreatePaymentDto` con:
 *        - customer_id (FK)
 *        - amount
 *        - currency
 *        - method
 *        - status (opcional, por defecto 'pending' si no se envía)
 *        - external_ref
 *   2. Verifica que el `customer_id` corresponda a un Customer existente.
 *      - Si NO existe, lanza un Error con `code = 'CUSTOMER_NOT_FOUND'`.
 *   3. Crea la entidad Payment usando la relación `customer` (no solo el customer_id).
 *   4. Guarda el Payment y devuelve el registro persistido.
 *
 * El controller, al llamar a este servicio, es el responsable de:
 *   - Capturar el error 'CUSTOMER_NOT_FOUND'.
 *   - Devolver el código de estado HTTP adecuado (por ejemplo, 400 o 404).
 */
export async function createPaymentService(dto: CreatePaymentDto) 
{
  // Obtiene el repositorio de la entidad Payment.
  const paymentRepo = AppDataSource.getRepository(Payment);

  // Obtiene el repositorio de la entidad Customer.
  const customerRepo = AppDataSource.getRepository(Customer);

  // 1) Verificar que el customer exista
  const customer = await customerRepo.findOneBy({
    customer_id: dto.customer_id,
  });

  if (!customer) {
    // Si no existe el Customer, lanzamos un error con un code específico
    // para que el controller pueda distinguir este caso.
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';
    throw error;
  }

  // 2) Crear la instancia de Payment
  //    - Se asigna el objeto `customer` completo para que TypeORM
  //      maneje la relación y la FK (customer_id) de forma automática.
  const entity = paymentRepo.create({
    customer,
    amount: dto.amount,
    currency: dto.currency,
    method: dto.method,
    status: dto.status ?? 'pending', // status por defecto 'pending' si no se envía
    external_ref: dto.external_ref,
  });

  // 3) Persistir el Payment en la base de datos
  return paymentRepo.save(entity);
}

/** 
 * Actualiza parcialmente un payment existente a partir de un DTO de actualización.
 *
 * Flujo:
 *   1. Recibe:
 *        - `id`: identificador del payment a actualizar.
 *        - `dto`: datos opcionales para actualizar (UpdatePaymentDto).
 *   2. Busca el Payment en la BD, cargando también la relación `customer`.
 *      - Si no existe, devuelve `null` (el controller decidirá si responde 404).
 *   3. Si viene `customer_id` en el DTO:
 *        - Verifica que el nuevo customer exista.
 *        - Si no existe, lanza error con `code = 'CUSTOMER_NOT_FOUND'`.
 *        - Si existe, reemplaza `existing.customer` por el nuevo Customer.
 *   4. Actualiza los campos simples (amount, method, status) solo si vienen definidos.
 *   5. Guarda la entidad y devuelve el Payment actualizado.
 */
export async function updatePaymentService(id: string, dto: UpdatePaymentDto) 
{
  // Obtiene el repositorio de la entidad Payment.
  const paymentRepo = AppDataSource.getRepository(Payment);

  // Obtiene el repositorio de la entidad Customer.
  const customerRepo = AppDataSource.getRepository(Customer);

  // 1) Buscar el payment a actualizar (con su customer actual).
  const existing = await paymentRepo.findOne({
    where: { payment_id: id },
    relations: { customer: true },
  });

  // Si no se encontró nada, devolvemos null (el controller responderá 404).
  if (!existing) return null;

  // 2) Si el DTO trae un nuevo customer_id, se valida y se actualiza la relación.
  if (dto.customer_id) 
  {
    const newCustomer = await customerRepo.findOneBy({
      customer_id: dto.customer_id,
    });

    if (!newCustomer) {
      const error: any = new Error('Customer no encontrado');
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }

    // Actualizamos la relación ManyToOne: ahora el payment pertenece a otro customer.
    existing.customer = newCustomer;
  }

  // 3) Actualizar campos primitivos si el DTO los trae definidos.
  if (dto.amount !== undefined) existing.amount = dto.amount;
  if (dto.method !== undefined) existing.method = dto.method;
  if (dto.status !== undefined) existing.status = dto.status;

  // 4) Guardar cambios en la BD.
  return paymentRepo.save(existing);
}

/** 
 * Elimina un payment por su ID.
 *
 * - Recibe el `id` del Payment.
 * - Ejecuta un `delete` por `payment_id`.
 * - Devuelve el número de filas afectadas:
 *     - 0  → no existía ningún payment con ese id.
 *     - 1+ → se eliminó al menos un registro (normalmente 1).
 *
 * El controller puede usar este valor para:
 *   - Responder 404 si `affected` es 0.
 *   - Responder 204 (No Content) si `affected` > 0.
 */
export async function deletePaymentService(id: string) 
{
  // Obtiene el repositorio de la entidad Payment.
  const repo = AppDataSource.getRepository(Payment);

  // Ejecuta el borrado por payment_id.
  const result = await repo.delete({ payment_id: id });

  // `affected` indica cuántas filas se borraron. Si viene undefined, devolvemos 0.
  return result.affected ?? 0;
}