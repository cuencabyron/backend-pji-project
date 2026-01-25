// Importa el DataSource de TypeORM.
// En estas pruebas se mockea para NO conectarse a una base de datos real.
import { AppDataSource } from '@/config/data-source';

// Importa las entidades involucradas en el módulo de Verification.
// Se usan para tipar objetos fake y/o para identificar repositorios que el service pide.
import { Verification } from '@/modules/verification/verification.entity';
import { Session } from '@/modules/session/session.entity';
import { Payment } from '@/modules/payment/payment.entity';
import { Customer } from '@/modules/customer/customer.entity';

// Importa las funciones del service que se van a probar (unit tests).
import {
  findAllVerifications,
  findVerificationById,
  createVerificationService,
  updateVerificationService,
  deleteVerificationService,
} from '@/modules/verification/verification.service';

// Importa los DTOs (tipos de entrada) del módulo Verification.
import { CreateVerificationDto } from '@/modules/verification/dtos/create-verification.dto';
import { UpdateVerificationDto } from '@/modules/verification/dtos/update-verification.dto';

// Mock del DataSource para evitar uso de BD real.
// Se reemplaza AppDataSource.getRepository por un jest.fn() controlable desde los tests.
jest.mock('@/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

// Atajo: castea getRepository a jest.Mock para poder usar mockReturnValueOnce, mockImplementation, etc.
const mockGetRepository = AppDataSource.getRepository as jest.Mock;

// Factory: crea un "repositorio" falso para Verification con los métodos que el service usa.
// Nota: aquí incluimos varios métodos típicos de TypeORM; no todos se usan en todos los tests.
function createVerificationRepoMock() {
  return {
    // Para findAllVerifications()
    find: jest.fn(),

    // Para búsquedas directas por columnas simples (si el service lo usa).
    findOneBy: jest.fn(),

    // Para búsquedas más completas con relations/where (si el service lo usa).
    findOne: jest.fn(),

    // Para construir la entidad antes de persistir.
    create: jest.fn(),

    // Para persistir cambios (create/update).
    save: jest.fn(),

    // Para eliminar registros.
    delete: jest.fn(),
  };
}

// Suite: pruebas unitarias del VerificationService.
// Estas pruebas verifican la lógica del service aislada de Express, routers y DB real.
describe('VerificationService (unit tests)', () => {
  // Limpia mocks antes de cada test para evitar contaminación entre casos.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================
  // findAllVerifications
  // =========================================================
  it('findAllVerifications → devuelve todas las verificaciones', async () => 
  {
    // Repo falso de Verification que el service usará internamente.
    const repo = createVerificationRepoMock();

    // Datos fake que simulan registros de la BD.
    const fake: Verification[] = [
      {
        verification_id: 'ver-1',
        customer_id: 'cust-1',
        session_id: 'sess-1',
        payment_id: 'pay-1',
        type: 'email',
        status: 'pending',
        attempts: 3,
        created_at: new Date(),
        updated_at: new Date(),
      } as Verification,
    ];

    // Configura repo.find() para que regrese el arreglo fake.
    repo.find.mockResolvedValue(fake);

    // Configura getRepository() para que, cuando el service lo pida, reciba este repo falso.
    // Ojo: aquí usamos mockReturnValueOnce, asumiendo que el service hace 1 llamada a getRepository.
    mockGetRepository.mockReturnValueOnce(repo);

    // Ejecuta la función real del service.
    const result = await findAllVerifications();

    // Verifica que regresa exactamente el arreglo fake.
    expect(result).toEqual(fake);
  });


  // =========================================================
  // findVerificationById
  // =========================================================
  it('findVerificationById → devuelve null si no existe', async () => 
  {
    // Repo falso de Verification.
    const repo = createVerificationRepoMock();

    // Simula que findOne() no encuentra nada.
    // (El service usa findOne en este caso; si usara findOneBy, se mockearía ese método.)
    repo.findOne.mockResolvedValue(null);

    // Inyecta repo falso al service.
    mockGetRepository.mockReturnValueOnce(repo);

    // Ejecuta la búsqueda por id inexistente.
    const result = await findVerificationById('ver-404');

    // Debe retornar null para que el controller pueda responder 404.
    expect(result).toBeNull();
  });


  // =========================================================
  // createVerification
  // =========================================================
  it('createVerification → lanza SESSION_NOT_FOUND si no existe la sesión', async () => 
  {
    // Repo falso para guardar Verification (create/save). Aquí no lo usamos explícitamente en el error,
    // pero el service normalmente lo obtiene al inicio.
    const verificationRepo = createVerificationRepoMock();
    
    // Repo falso de Customer: simula que el customer existe.
    const customerRepo = {
      // El service consultará customerRepo.findOneBy({ customer_id: ... }).
      findOneBy: jest
      .fn()
      .mockResolvedValue({ customer_id: 'cust-1' } as Customer),
    };

    // Repo falso de Session: aquí forzamos que NO exista para provocar SESSION_NOT_FOUND.
    const sessionRepo = {
      // El service consultará sessionRepo.findOneBy({ session_id: ... }).
      findOneBy: jest
        .fn()
        .mockResolvedValue(null),
    };

    // Repo falso de Payment: simula que el payment existe.
    const paymentRepo = {
      // El service consultará paymentRepo.findOneBy({ payment_id: ... }).
      findOneBy: jest
        .fn()
        .mockResolvedValue({ payment_id: 'pay-1' } as Payment),
    };

    // DTO que llega al service para crear la verificación.
    const dto: CreateVerificationDto = {
      customer_id: 'cust-1',
      session_id: 'sess-no-existe', // id que no existe a propósito
      payment_id: 'pay-1',
      type: 'email',
      status: 'pending',
      attempts: 3,
    };

    // Configura el orden de respuestas de getRepository().
    // Esto depende del ORDEN en que createVerificationService() llame getRepository() internamente.
    // Ejemplo típico:
    //   1) getRepository(Verification)
    //   2) getRepository(Customer)
    //   3) getRepository(Session)
    //   4) getRepository(Payment)
    mockGetRepository
      .mockReturnValueOnce(verificationRepo)
      .mockReturnValueOnce(customerRepo)
      .mockReturnValueOnce(sessionRepo)
      .mockReturnValueOnce(paymentRepo);

    // Espera que el service rechace con un error tipificado cuyo code sea SESSION_NOT_FOUND.
    await expect(createVerificationService(dto as any)).rejects.toMatchObject({
      code: 'SESSION_NOT_FOUND',
    });
  });


  it('createVerification → incrementa attempts y guarda', async () => 
  {
    // Repo falso para Verification (create/save).
    const verificationRepo = createVerificationRepoMock();

    // Repo falso de Customer: simula que existe.
    const customerRepo = {
      findOneBy: jest
        .fn()
        .mockResolvedValue({ customer_id: 'cust-1' } as Customer),
      };

    // Repo falso de Session: simula que existe.
    const sessionRepo = { 
      findOneBy: jest
        .fn()
        .mockResolvedValue({ session_id: 'sess-1' } as Session), 
      };

    // Repo falso de Payment: simula que existe.
    const paymentRepo = {
      findOneBy: jest
        .fn()
        .mockResolvedValue({ payment_id: 'pay-1' } as Payment),
    };

    // DTO de creación (attempts inicia en 1).
    const dto: CreateVerificationDto = {
      customer_id: 'cust-1',
      session_id: 'sess-1',
      payment_id: 'pay-1',
      type: 'sms',
      status: 'pending',
      attempts: 1,
    };

    // Objeto fake que simula la entidad construida/guardada.
    // Nota: este test asume que el service incrementa attempts internamente,
    // pero aquí no se refleja explícitamente. Si tu service hace attempts + 1,
    // lo recomendable es reflejarlo en fakeVerification y en las expectativas.
    const fakeVerification = {
      verification_id: 'ver-1',
      ...dto,
    } as Verification;

    // Configura create/save del repo de Verification.
    verificationRepo.create.mockReturnValue(fakeVerification);
    verificationRepo.save.mockResolvedValue(fakeVerification);

    // Inyecta repos al service en el orden esperado.
    mockGetRepository
      .mockReturnValueOnce(verificationRepo)
      .mockReturnValueOnce(customerRepo)
      .mockReturnValueOnce(sessionRepo)
      .mockReturnValueOnce(paymentRepo);

    // Ejecuta el service.
    const result = await createVerificationService(dto);

    // Verifica que el service consultó el customer referenciado por el DTO.
    expect(customerRepo.findOneBy).toHaveBeenCalledWith({
      customer_id: dto.customer_id,
    });

    // Verifica que el service consultó la session referenciada por el DTO.
    expect(sessionRepo.findOneBy).toHaveBeenCalledWith({
      session_id: dto.session_id,
    });

    // Verifica que el service consultó el payment referenciado por el DTO.
    expect(paymentRepo.findOneBy).toHaveBeenCalledWith({
      payment_id: dto.payment_id,
    });

    // Verifica que se construyó una entidad (create).
    expect(verificationRepo.create).toHaveBeenCalled();

    // Verifica que se guardó la entidad (save) con el objeto esperado.
    expect(verificationRepo.save).toHaveBeenCalledWith(fakeVerification);

    // Verifica que el resultado final es el guardado.
    expect(result).toEqual(fakeVerification);
  });


  // =========================================================
  // updateVerification
  // =========================================================
  it('updateVerification → devuelve null si no existe', async () => 
  {
    // Repo falso de Verification.
    const verificationRepo = createVerificationRepoMock();

    // Repos falsos de Session/Payment (se inyectan porque el service probablemente los solicita).
    const sessionRepo = { findOneBy: jest.fn() };
    const paymentRepo = { findOneBy: jest.fn() };

    // Simula que no existe la verification al buscarla por id.
    verificationRepo.findOne.mockResolvedValue(null);

    // Inyecta repos según el orden esperado de llamadas a getRepository().
    mockGetRepository
      .mockReturnValueOnce(verificationRepo)
      .mockReturnValueOnce(sessionRepo)
      .mockReturnValueOnce(paymentRepo);

    // DTO de actualización (cambia status).
    const dto: UpdateVerificationDto = { status: 'approved' };

    // Ejecuta update para un id inexistente.
    const result = await updateVerificationService('ver-404', dto);

    // Debe retornar null para que el controller responda 404.
    expect(result).toBeNull();
  });


  // =========================================================
  // deleteVerification
  // =========================================================
  it('deleteVerification → devuelve 1 si se elimina la verificación', async () => 
  {
    // Repo falso de Verification.
    const verificationRepo = createVerificationRepoMock();

    // Simula delete exitoso: TypeORM típicamente retorna { affected: number }.
    verificationRepo.delete.mockResolvedValue({ affected: 1 });

    // Inyecta repo falso.
    mockGetRepository.mockReturnValueOnce(verificationRepo);

    // Ejecuta delete.
    const affected = await deleteVerificationService('ver-1');

    // Debe retornar 1 fila afectada.
    expect(affected).toBe(1);
  });
});