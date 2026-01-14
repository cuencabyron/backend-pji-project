/** Servicios (capa de negocio) para la entidad Verification.
 *  Este módulo encapsula toda la lógica relacionada con verificaciones:
 *  - findAllVerifications:
 *      Obtiene todas las verificaciones, incluyendo sus relaciones
 *      con customer, session y payment.
 *  - findVerificationById:
 *      Busca una verificación específica por su ID (verification_id),
 *      cargando también sus relaciones.
 *  - createVerificationService:
 *      Crea una nueva verificación validando primero que existan
 *      el customer, la session y el payment asociados. Si alguno
 *      no existe, lanza errores de negocio con códigos específicos:
 *        - CUSTOMER_NOT_FOUND
 *        - SESSION_NOT_FOUND
 *        - PAYMENT_NOT_FOUND
 *  - updateVerificationService:
 *      Actualiza parcialmente una verificación existente.
 *      Permite cambiar relaciones (customer, session, payment) y
 *      campos simples (type, status, attempts). También lanza
 *      errores de negocio si las nuevas relaciones no existen.
 *  - deleteVerificationService:
 *      Elimina una verificación por su ID y devuelve cuántas filas
 *      fueron afectadas. El controller decide si responde 404 cuando
 *      el número de filas eliminadas es 0.
 * Nota:
 *  Esta capa NO devuelve respuestas HTTP ni maneja códigos de estado.
 *  Solo trabaja con entidades y DTOs. Los controladores HTTP (controllers)
 *  son los que llaman a estos servicios y construyen la respuesta HTTP
 *  adecuada (200, 201, 404, 500, etc.).
 */

// DataSource de TypeORM ya configurado (host, usuario, password, entidades, etc.).
import { AppDataSource } from '@/config/data-source';

// Entidad que mapea la tabla "verification" en la base de datos.
import { Verification } from '@/modules/verification/verification.entity';

// Entidad que mapea la tabla "customer" en la base de datos.
import { Customer } from '@/modules/customer/customer.entity';

// Entidad que mapea la tabla "session" en la base de datos.
import { Session } from '@/modules/session/session.entity';

// Entidad que mapea la tabla "payment" en la base de datos.
import { Payment } from '@/modules/payment/payment.entity';

// DTO que define la forma esperada de los datos para CREAR una verification.
import { CreateVerificationDto } from '@/modules/verification/dtos/create-verification.dto';

// DTO que define la forma esperada de los datos para ACTUALIZAR una verification.
import { UpdateVerificationDto } from '@/modules/verification/dtos/update-verification.dto';

/** Obtiene todas las verifications registradas en la base de datos.
 *  Responsabilidades:
 *    - Usar el repositorio de TypeORM para la entidad Verification.
 *    - Cargar las relaciones con Customer, Session y Payment.
 *    - Ordenar por fecha de creación (created_at) en orden descendente
 *      (las verificaciones más recientes primero).
 *
 * Esta función NO conoce nada de HTTP. Solo devuelve datos al controller.
 */
export async function findAllVerifications() 
{
  // Obtiene el repositorio de la entidad Verification desde el DataSource.
  const repo = AppDataSource.getRepository(Verification);

  // Busca todas las verificaciones incluyendo sus relaciones y ordenadas por fecha.
  return repo.find({
    relations: { customer: true, session: true, payment: true },
    order: { created_at: 'DESC' },
  });
}

/** Busca una verification específica por su ID (UUID).
 *    - Recibe el id como string.
 *    - Devuelve:
 *        - La entidad Verification con sus relaciones (customer, session, payment),
 *          si existe.
 *        - null, si no se encontró ninguna verification con ese id.
 */
export async function findVerificationById(id: string) 
{
  // Obtiene el repositorio de la entidad Verification desde el DataSource.
  const repo = AppDataSource.getRepository(Verification);

  // Busca la verification por su clave primaria `verification_id`.
  return repo.findOne({
    where: { verification_id: id },
    relations: { customer: true, session: true, payment: true },
  });
}

/** Crea una nueva verification a partir de un DTO de creación.
 *  Flujo:
 *    1) Obtiene los repositorios de Verification, Customer, Session y Payment.
 *    2) Valida que existan las entidades relacionadas:
 *        - customer_id debe existir en la tabla customer.
 *        - session_id debe existir en la tabla session.
 *        - payment_id debe existir en la tabla payment.
 *      Si alguna no existe, lanza un Error con un `code` específico:
 *        - 'CUSTOMER_NOT_FOUND'
 *        - 'SESSION_NOT_FOUND'
 *        - 'PAYMENT_NOT_FOUND'
 *    3) Crea una entidad Verification asociando los objetos relacionados.
 *    4) Aplica valor por defecto a status ('pending') si no viene en el DTO.
 *    5) Guarda la entidad en la base de datos y devuelve el registro creado.
 * @param dto Datos necesarios para crear la verification (CreateVerificationDto).
 */
export async function createVerificationService(dto: CreateVerificationDto) 
{
  // Repositorio de la entidad principal (Verification).
  const verificationRepo = AppDataSource.getRepository(Verification);

  // Repositorios de las entidades relacionadas.
  const customerRepo = AppDataSource.getRepository(Customer);
  const sessionRepo = AppDataSource.getRepository(Session);
  const paymentRepo = AppDataSource.getRepository(Payment);

  // Busca en paralelo el customer, la session y el payment referenciados por el DTO.
  const [customer, session, payment] = await Promise.all([
    customerRepo.findOneBy({ customer_id: dto.customer_id }),
    sessionRepo.findOneBy({ session_id: dto.session_id }),
    paymentRepo.findOneBy({ payment_id: dto.payment_id }),
  ]);

  // Si no existe el Customer, lanza error de negocio.
  if (!customer) {
    const e: any = new Error('customer_id no existe');
    e.code = 'CUSTOMER_NOT_FOUND';
    throw e;
  }

  // Si no existe la Session, lanza error de negocio.
  if (!session) {
    const e: any = new Error('session_id no existe');
    e.code = 'SESSION_NOT_FOUND';
    throw e;
  }

  // Si no existe el Payment, lanza error de negocio.
  if (!payment) {
    const e: any = new Error('payment_id no existe');
    e.code = 'PAYMENT_NOT_FOUND';
    throw e;
  }

  // Crea una nueva instancia de Verification asociada a las entidades encontradas.
  const entity = verificationRepo.create({
    customer,
    session,
    payment,
    type: dto.type,
    // Si no viene status en el DTO, se asume 'pending' por defecto.
    status: dto.status ?? 'pending',
    attempts: dto.attempts,
  });

  // Guarda la verification en la BD y devuelve el registro insertado.
  return verificationRepo.save(entity);
}

/** Actualiza parcialmente una verification existente a partir de un DTO de actualización.
 *  Flujo:
 *    1) Carga la verification actual desde la BD con sus relaciones.
 *        - Si no existe → devuelve null (el controller devolverá 404).
 *    2) Si en el DTO viene un nuevo customer_id / session_id / payment_id:
 *        - Busca la nueva entidad relacionada.
 *        - Si no existe, lanza error con code:
 *            'CUSTOMER_NOT_FOUND' | 'SESSION_NOT_FOUND' | 'PAYMENT_NOT_FOUND'.
 *        - Si existe, actualiza la relación en `existing`.
 *    3) Actualiza los campos simples (type, status, attempts) solo si están definidos.
 *    4) Guarda los cambios y devuelve la entidad actualizada.
 *
 * @param id  ID de la verification a actualizar.
 * @param dto Datos opcionales a modificar (UpdateVerificationDto).
 */
export async function updateVerificationService(id: string, dto: UpdateVerificationDto) 
{
  // Repositorio de la entidad principal (Verification).
  const verificationRepo = AppDataSource.getRepository(Verification);

  // Repositorios de las entidades relacionadas.
  const customerRepo = AppDataSource.getRepository(Customer);
  const sessionRepo = AppDataSource.getRepository(Session);
  const paymentRepo = AppDataSource.getRepository(Payment);

  // Carga la verification existente desde la BD, incluyendo relaciones.
  const existing = await verificationRepo.findOne({
    where: { verification_id: id },
    relations: { customer: true, session: true, payment: true },
  });

  // Si no existe ninguna verification con ese id, se devuelve null.
  if (!existing) return null;

  // Si el DTO trae un nuevo customer_id, se intenta cambiar la relación.
  if (dto.customer_id) {
    const c = await customerRepo.findOneBy({ customer_id: dto.customer_id });
    if (!c) {
      const e: any = new Error('customer_id no existe');
      e.code = 'CUSTOMER_NOT_FOUND';
      throw e;
    }
    existing.customer = c;
  }

  // Si el DTO trae un nuevo session_id, se intenta cambiar la relación.
  if (dto.session_id) {
    const s = await sessionRepo.findOneBy({ session_id: dto.session_id });
    if (!s) {
      const e: any = new Error('session_id no existe');
      e.code = 'SESSION_NOT_FOUND';
      throw e;
    }
    existing.session = s;
  }

  // Si el DTO trae un nuevo payment_id, se intenta cambiar la relación.
  if (dto.payment_id) {
    const p = await paymentRepo.findOneBy({ payment_id: dto.payment_id });
    if (!p) {
      const e: any = new Error('payment_id no existe');
      e.code = 'PAYMENT_NOT_FOUND';
      throw e;
    }
    existing.payment = p;
  }

  // Actualiza campos simples solo si vienen definidos en el DTO.
  if (dto.type !== undefined) existing.type = dto.type;
  if (dto.status !== undefined) existing.status = dto.status;
  if (dto.attempts !== undefined) existing.attempts = dto.attempts;

  // Guarda y devuelve la verification actualizada.
  return verificationRepo.save(existing);
}

/** Elimina una verification por su ID.
 * - Ejecuta un `DELETE` en la tabla `verification` filtrando por `verification_id`.
 * - Devuelve el número de filas afectadas:
 *     - 0 → no había ninguna verification con ese id.
 *     - >0 → se eliminó correctamente.
 *
 * @param id ID de la verification a borrar.
 * @returns Número de filas eliminadas (0 si no existía).
 */
export async function deleteVerificationService(id: string) 
{
  // Repositorio de la entidad principal (Verification).
  const repo = AppDataSource.getRepository(Verification);

  // Ejecuta el borrado en la base de datos.
  const result = await repo.delete({ verification_id: id });

  // `affected` indica cuántas filas se eliminaron. Si viene undefined, devolvemos 0.
  return result.affected ?? 0;
}