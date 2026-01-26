// Importa el DataSource (TypeORM). En estas pruebas se mockea para NO tocar BD real.
import { AppDataSource } from '@/config/data-source';

// Importa la entidad Session: el service pide su repositorio y se usa para tipar datos fake.
import { Session } from '@/modules/session/session.entity';

// Importa la entidad Customer porque create/update de Session validan que el customer exista.
import { Customer } from '@/modules/customer/customer.entity';

// Importa las funciones del service que se van a probar (unit tests).
import {
  findAllSessions,
  findSessionById,
  createSessionService,
  updateSessionService,
  deleteSessionService,
} from '@/modules/session/session.service';

// Importa DTOs del módulo Session (tipos de entrada al service).
import { CreateSessionDto } from '@/modules/session/dtos/create-session.dto';
import { UpdateSessionDto } from '@/modules/session/dtos/update-session.dto';

// Mock del DataSource para evitar conexión real.
// Reemplaza AppDataSource.getRepository por jest.fn() para controlar qué "repo" recibe el service.
jest.mock('@/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

// Atajo: castea getRepository a jest.Mock para usar mockReturnValueOnce, mockImplementation, etc.
const mockGetRepository = AppDataSource.getRepository as jest.Mock;

// Factory: crea un repositorio falso con los métodos que el service podría usar.
// (Incluye métodos típicos de TypeORM y otros de utilidad como count).
function createSessionRepoMock() {
  return {
    // Para findAllSessions()
    find: jest.fn(),

    // Para búsquedas por columnas simples (si el service lo usa).
    findOneBy: jest.fn(),

    // Para búsquedas más completas con relations/where (si el service lo usa).
    findOne: jest.fn(),

    // Para construir entidad antes de guardar.
    create: jest.fn(),

    // Para persistir create/update.
    save: jest.fn(),

    // Para borrar por id.
    delete: jest.fn(),

    // Para conteos (algunos services lo usan para validaciones).
    count: jest.fn(),
  };
}

// Suite: pruebas unitarias del SessionService (sin Express, sin router, sin BD real).
describe('SessionService (unit tests)', () => {
  // Limpia mocks entre tests para que no se contaminen.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================
  // findAllSessions
  // =========================================================
  it('findAllSessions → devuelve todas las sesiones con customer', async () => 
  {
    // Repo falso de Session.
    const repo = createSessionRepoMock();

    // Arreglo de sesiones fake que simulan registros.
    const fakeSessions: Session[] = [
      {
        session_id: 'sess-1',
        customer_id: 'cust-1',
        user_agent: 'Chrome',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      } as Session,
    ];

    // Simula que repo.find() devuelve las sesiones.
    repo.find.mockResolvedValue(fakeSessions);

    // Inyecta el repo fake cuando el service pida getRepository(Session).
    // Se asume que findAllSessions hace una sola llamada a getRepository.
    mockGetRepository.mockReturnValueOnce(repo);

    // Ejecuta el service real.
    const result = await findAllSessions();

    // Verifica que se pidió el repositorio de Session.
    expect(mockGetRepository).toHaveBeenCalledWith(Session);

    // Verifica que se llamó repo.find una vez.
    expect(repo.find).toHaveBeenCalledTimes(1);

    // Verifica que el resultado coincide con lo fake.
    expect(result).toEqual(fakeSessions);
  });


  // =========================================================
  // findSessionById
  // =========================================================
  it('findSessionById → devuelve null si no existe', async () => 
  {
    // Repo falso de Session.
    const repo = createSessionRepoMock();

    // Simula que findOne() no encuentra nada.
    // (Si tu implementación usa findOneBy, aquí se mockearía findOneBy.)
    repo.findOne.mockResolvedValue(null);

    // Inyecta el repo fake.
    mockGetRepository.mockReturnValueOnce(repo);

    // Ejecuta la búsqueda por id inexistente.
    const result = await findSessionById('no-existe');

    // Debe devolver null para que el controller responda 404.
    expect(result).toBeNull();
  });


  // =========================================================
  // createSessionService
  // =========================================================
  it('createSessionService → lanza CUSTOMER_NOT_FOUND si el customer no existe', async () => 
  {
    // Repo falso de Session (para create/save).
    const sessionRepo = createSessionRepoMock();

    // Repo falso de Customer: fuerza "customer no existe".
    const customerRepo = {
      // El service consultará customerRepo.findOneBy({ customer_id: dto.customer_id }).
      findOneBy: jest.fn().mockResolvedValue(null),
    };

    // Configura el orden en que getRepository devolverá repos.
    // Esto depende del ORDEN real de llamadas en createSessionService().
    // Ejemplo típico:
    // 1) getRepository(Session)
    // 2) getRepository(Customer)
    mockGetRepository
      .mockReturnValueOnce(sessionRepo)   // Session
      .mockReturnValueOnce(customerRepo); // Customer

    // DTO de creación de sesión.
    const dto: CreateSessionDto = {
      customer_id: 'cust-99', // no existe a propósito
      user_agent: 'Firefox',
      status: 'active',
    };

    // Espera error tipificado por el service.
    await expect(createSessionService(dto as any)).rejects.toMatchObject({
      code: 'CUSTOMER_NOT_FOUND',
    });
  });


  it('createSessionService → crea la sesión si el customer existe', async () => 
  {
    // Repo falso de Session.
    const sessionRepo = createSessionRepoMock();

    // Repo falso de Customer: simula que sí existe.
    const customerRepo = {
      findOneBy: jest.fn().mockResolvedValue({
        customer_id: 'cust-1',
      } as Customer),
    };

    // DTO de creación.
    const dto: CreateSessionDto = {
      customer_id: 'cust-1',
      user_agent: 'Chrome',
      status: 'active',
    };

    // Sesión fake retornada por repo.create/save.
    const fakeSession = {
      session_id: 'sess-1',
      ...dto,
    } as Session;

    // create construye el objeto a persistir.
    sessionRepo.create.mockReturnValue(fakeSession);

    // save simula persistencia exitosa.
    sessionRepo.save.mockResolvedValue(fakeSession);

    // Inyecta repos en el orden esperado por el service.
    mockGetRepository
      .mockReturnValueOnce(sessionRepo)   // Session
      .mockReturnValueOnce(customerRepo); // Customer

    // Ejecuta el service.
    const result = await createSessionService(dto);

    // Debe retornar la sesión guardada.
    expect(result).toEqual(fakeSession);
  });


  // =========================================================
  // updateSessionService
  // =========================================================
  it('updateSessionService → devuelve null si la sesión no existe', async () => 
  {
    // Repo falso de Session.
    const sessionRepo = createSessionRepoMock();

    // Repo falso de Customer (se inyecta porque el service podría validar customer_id si viene en DTO).
    const customerRepo = { findOneBy: jest.fn() };

    // Simula que findOne() no encuentra la sesión.
    sessionRepo.findOne.mockResolvedValue(null);

    // Inyecta repos en el orden esperado.
    // Ejemplo típico:
    // 1) getRepository(Session)
    // 2) getRepository(Customer)
    mockGetRepository
      .mockReturnValueOnce(sessionRepo)
      .mockReturnValueOnce(customerRepo);

    // DTO de actualización.
    const dto: UpdateSessionDto = { status: 'ended' };

    // Ejecuta update sobre id inexistente.
    const result = await updateSessionService('sess-99', dto);

    // Debe retornar null para que el controller responda 404.
    expect(result).toBeNull();
  });


  // =========================================================
  // deleteSessionService
  // =========================================================
  it('deleteSessionService → devuelve 1 si se borra la sesión', async () => 
  {
    // Repo falso de Session.
    const sessionRepo = createSessionRepoMock();

    // Simula borrado exitoso: TypeORM suele devolver { affected: number }.
    sessionRepo.delete.mockResolvedValue({ affected: 1 });

    // Inyecta repo fake.
    mockGetRepository.mockReturnValueOnce(sessionRepo);

    // Ejecuta delete.
    const affected = await deleteSessionService('sess-1');

    // Debe retornar 1 fila afectada.
    expect(affected).toBe(1);
  });
});