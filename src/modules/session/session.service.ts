/** Servicios de dominio para la entidad Session.
 *  En este archivo se implementa la lógica de acceso a datos y reglas básicas
 *  de negocio relacionadas con sesiones de cliente (Session), utilizando
 *  TypeORM y el DataSource de la aplicación.
 *  Importante:
 *    - Aquí **no** se maneja HTTP ni objetos Request/Response.
 *    - Estas funciones son reutilizables y son llamadas por los controladores.
 *    - Devuelven entidades, null o valores simples; el controller traduce eso
 *      a códigos y respuestas HTTP (200, 201, 404, 500, etc.).
 */

// DataSource de TypeORM ya configurado (host, usuario, password, entidades, etc.).
import { AppDataSource } from '@/config/data-source';

// Entidad que mapea la tabla "session" en la base de datos.
import { Session } from '@/modules/session/session.entity';

// Entidad que mapea la tabla "customer" en la base de datos.
import { Customer } from '@/modules/customer/customer.entity';

// DTO para CREAR una sesión.
import { CreateSessionDto } from '@/modules/session/dtos/create-session.dto';

// DTO para ACTUALIZAR una sesión.
import { UpdateSessionDto } from '@/modules/session/dtos/update-session.dto';

/**Obtiene todas las sesiones almacenadas en la base de datos.
 *    - Incluye la relación con Customer (`relations: { customer: true }`).
 *    - Solo realiza lectura, sin lógica de negocio adicional.
 */
export async function findAllSessions(): Promise<Session[]> 
{
  // Obtenemos el repositorio para la entidad Session.
  const repo = AppDataSource.getRepository(Session);

  // Buscamos todas las sesiones incluyendo la información del customer.
  return repo.find({
    relations: { customer: true },
  });
}

/** Busca una sesión por su ID (UUID).
 *    - Incluye la relación con Customer.
 *    - Si no existe, devuelve `null` (el controller decide si responde 404).
 */
export async function findSessionById(id: string): Promise<Session | null> 
{
  // Obtenemos el repositorio para la entidad Session.
  const repo = AppDataSource.getRepository(Session);

  /* Busca un único registro cuyo payment_id coincida con el id recibido.
  Además, `relations: { customer: true }` indica a TypeORM que también
  cargue los datos del Customer relacionado (JOIN en la consulta).*/
  return repo.findOne({
    where: { session_id: id },
    relations: { customer: true },
  });
}

/** Crea una nueva sesión para un customer.
 *  Reglas de negocio:
 *    - Verifica que el `customer_id` recibido en el DTO exista en la BD.
 *    - Si el customer no existe, lanza un Error con `code = 'CUSTOMER_NOT_FOUND'`
 *      para que el controller pueda responder 400 Bad Request.
 *    - Crea la sesión con:
 *        - `customer` (relación)
 *        - `user_agent` desde el DTO
 *        - `status` con valor por defecto 'active' si no se especifica.
 */
export async function createSessionService(dto: CreateSessionDto, ): Promise<Session> 
{
  // Obtenemos el repositorio para la entidad Session.
  const sessionRepo = AppDataSource.getRepository(Session);

  // Obtenemos el repositorio para la entidad Customer.
  const customerRepo = AppDataSource.getRepository(Customer);

  // Verificamos que el customer exista.
  const customer = await customerRepo.findOneBy({
    customer_id: dto.customer_id,
  });

  if (!customer) {
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';
    throw error;
  }

  // Creamos la entidad Session en memoria.
  const entity = sessionRepo.create({
    customer,                  // relación ManyToOne
    ip_address: dto.ip_address,
    user_agent: dto.user_agent,
    status: dto.status ?? 'active', // por defecto 'active'
  });

  // Persistimos y devolvemos la sesión ya guardada.
  return sessionRepo.save(entity);
}

/** Actualiza parcialmente una sesión existente.
 *  Reglas de negocio:
 *    - Si viene `customer_id` en el DTO:
 *        - Se valida que el nuevo customer exista.
 *        - Si no existe, se lanza Error con `code = 'CUSTOMER_NOT_FOUND'`.
 *    - Si la sesión con ese ID no existe, devuelve `null` (el controller decide 404).
 *    - Se actualizan solamente los campos definidos en el DTO
 *      (`user_agent`, `status`, y la relación `customer` si corresponde).
 */
export async function updateSessionService(id: string, dto: UpdateSessionDto, ): Promise<Session | null> 
{
  // Obtenemos el repositorio para la entidad Session.
  const sessionRepo = AppDataSource.getRepository(Session);

  // Obtenemos el repositorio para la entidad Customer.
  const customerRepo = AppDataSource.getRepository(Customer);

  // Buscamos la sesión actual incluyendo el customer asociado.
  const existing = await sessionRepo.findOne({
    where: { session_id: id },
    relations: { customer: true },
  });

  // Si no existe la sesión, devolvemos null.
  if (!existing) return null;

  // Si nos envían un nuevo customer_id, verificamos que exista
  // y reasignamos la relación.
  if (dto.customer_id) {
    const newCustomer = await customerRepo.findOneBy({
      customer_id: dto.customer_id,
    });

    if (!newCustomer) {
      const error: any = new Error('Customer no encontrado');
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }

    existing.customer = newCustomer;
  }

  // Actualizamos solo los campos definidos.
  if (dto.ip_address !== undefined) existing.ip_address = dto.ip_address;
  if (dto.user_agent !== undefined) existing.user_agent = dto.user_agent;
  if (dto.status !== undefined)      existing.status = dto.status;

  // Guardamos los cambios y devolvemos la sesión actualizada.
  return sessionRepo.save(existing);
}

/** Elimina una sesión por su ID.
 *    - Si no existe ninguna sesión con ese ID, `result.affected` será 0.
 *    - Devuelve el número de filas afectadas (0 o 1 normalmente).
 *      El controller normalmente:
 *        - responde 404 si es 0,
 *        - responde 204 No Content si es 1.
 */
export async function deleteSessionService(id: string): Promise<number> 
{
  // Obtenemos el repositorio para la entidad Session.
  const repo = AppDataSource.getRepository(Session);

  // Ejecuta el borrado por session_id.
  const result = await repo.delete({ session_id: id });

  // Devolvemos la cantidad de filas eliminadas (0 si no había registro).
  return result.affected ?? 0;
}