// Importa el DataSource (TypeORM). En este test se mockea para no tocar BD real.
import { AppDataSource } from '@/config/data-source';

// Importa la entidad Customer para identificar qué repositorio se solicita.
import { Customer } from '@/modules/customer/customer.entity';

// Importa la entidad Payment porque el service consulta pagos antes de borrar customer.
import { Payment } from '@/modules/payment/payment.entity';

// Importa las funciones del service que se van a probar (unit tests).
import {
  findAllCustomers,
  findCustomerById,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
} from '@/modules/customer/customer.service';

// Mock de AppDataSource para NO usar la BD real.
// Se reemplaza AppDataSource.getRepository por un jest.fn() controlable.
jest.mock('@/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

// Atajo: castea AppDataSource.getRepository a jest.Mock para poder usar mockImplementation, etc.
const mockGetRepository = AppDataSource.getRepository as jest.Mock;

// Factory: crea un "repositorio" falso de Customer con los métodos que el service usa.
function createCustomerRepoMock() {
  return {
    // Para findAllCustomers()
    find: jest.fn(),

    // Para findCustomerById() y también para deleteCustomerService() (verifica existencia)
    findOneBy: jest.fn(),

    // Para createCustomerService() y updateCustomerService() (validación de email único)
    findOne: jest.fn(),

    // Para createCustomerService() (construye entidad)
    create: jest.fn(),

    // Para createCustomerService() y updateCustomerService() (persistencia)
    save: jest.fn(),

    // Para deleteCustomerService() (borrado)
    delete: jest.fn(),
  };
}

// Factory: crea un "repositorio" falso de Payment con el método que el service usa.
function createPaymentRepoMock() {
  return {
    // Para deleteCustomerService() (contar pagos pendientes del customer)
    count: jest.fn(),
  };
}

// Suite: pruebas unitarias del CustomerService (sin Express, sin router, sin BD real).
describe('CustomerService (unit tests)', () => {
  // Limpia mocks antes de cada test.
  beforeEach(() => {
    jest.clearAllMocks();
  });


  // =====================================================================
  // findAllCustomers
  // =====================================================================
  it('findAllCustomers → devuelve todos los customers (usa repo.find)', async () => 
  {
    // Crea repositorio falso de Customer.
    const fakeCustomerRepo = createCustomerRepoMock();

    // Cuando el servicio llame AppDataSource.getRepository(Customer),
    // devolvemos nuestro repo falso.
    mockGetRepository.mockImplementation((entity) => {
      // Si el service pide el repo de Customer, se lo damos.
      if (entity === Customer) return fakeCustomerRepo;

      // Si pide otra entidad que no esperábamos en este test, fallamos el test.
      throw new Error('Unexpected entity');
    });

    // Datos fake que simulan registros en BD.
    const fakeData = [
      { customer_id: 'c1', name: 'Juan' },
      { customer_id: 'c2', name: 'Ana' },
    ];

    // Configura el comportamiento del repo falso: find() resuelve con fakeData.
    fakeCustomerRepo.find.mockResolvedValue(fakeData);

    // Ejecuta la función real del service.
    const result = await findAllCustomers();

    // Verifica que se pidió el repositorio correcto.
    expect(mockGetRepository).toHaveBeenCalledWith(Customer);

    // Verifica que el método find() fue invocado una vez.
    expect(fakeCustomerRepo.find).toHaveBeenCalledTimes(1);

    // Verifica que el resultado es exactamente el arreglo fake.
    expect(result).toEqual(fakeData);
  });


  // =====================================================================
  // findCustomerById
  // =====================================================================
  it('findCustomerById → devuelve un customer si existe', async () => 
  {
    // Repo falso de Customer.
    const fakeCustomerRepo = createCustomerRepoMock();

    // Inyecta repo falso cuando se solicite Customer.
    mockGetRepository.mockImplementation((entity) => {
      if (entity === Customer) return fakeCustomerRepo;
      throw new Error('Unexpected entity');
    });

    // Customer fake retornado por BD.
    const fakeCustomer = { customer_id: 'abc', name: 'Juan' };

    // Configura findOneBy para que encuentre el customer.
    fakeCustomerRepo.findOneBy.mockResolvedValue(fakeCustomer);

    // Ejecuta service.
    const result = await findCustomerById('abc');

    // Verifica que se buscó por el id correcto.
    expect(fakeCustomerRepo.findOneBy).toHaveBeenCalledWith({ customer_id: 'abc' });

    // Verifica el valor retornado.
    expect(result).toEqual(fakeCustomer);
  });

  it('findCustomerById → devuelve null si no existe', async () => 
  {
    // Repo falso de Customer.
    const fakeCustomerRepo = createCustomerRepoMock();

    // Inyecta repo falso cuando se solicite Customer.
    mockGetRepository.mockImplementation((entity) => {
      if (entity === Customer) return fakeCustomerRepo;
      throw new Error('Unexpected entity');
    });

    // Simula "no encontrado".
    fakeCustomerRepo.findOneBy.mockResolvedValue(null);

    // Ejecuta service.
    const result = await findCustomerById('no-existe');

    // Verifica que se buscó por el id correcto.
    expect(fakeCustomerRepo.findOneBy).toHaveBeenCalledWith({
      customer_id: 'no-existe',
    });

    // Debe retornar null.
    expect(result).toBeNull();
  });


  // =====================================================================
  // createCustomerService
  // =====================================================================
  it('createCustomerService → normaliza el teléfono, verifica email único y guarda', async () => 
  {
    // Repo falso de Customer.
    const fakeCustomerRepo = createCustomerRepoMock();

    // Inyecta repo falso cuando se solicite Customer.
    mockGetRepository.mockImplementation((entity) => {
      if (entity === Customer) return fakeCustomerRepo;
      throw new Error('Unexpected entity');
    });

    // Simula que NO existe otro customer con el mismo email (email único).
    fakeCustomerRepo.findOne.mockResolvedValue(null);

    // DTO de entrada (como vendría desde controller).
    const dto = {
      name: 'Juan',
      email: 'juan@example.com',
      phone: '55 1234-5678', // formato con espacios/guiones: el service lo normaliza.
      address: 'CDMX',
      active: true,
    };

    // Entidad creada "normalizada" (ej: elimina espacios y guiones del teléfono).
    const createdEntity = { ...dto, phone: '5512345678' }; // normalizado

    // Entidad guardada (simula que BD asigna customer_id).
    const savedEntity = { customer_id: 'c1', ...createdEntity };

    // Configura repo.create para regresar la entidad creada.
    fakeCustomerRepo.create.mockReturnValue(createdEntity);

    // Configura repo.save para regresar la entidad guardada.
    fakeCustomerRepo.save.mockResolvedValue(savedEntity);

    // Ejecuta el service.
    const result = await createCustomerService(dto as any);

    // Verifica que el service buscó duplicados por email.
    expect(fakeCustomerRepo.findOne).toHaveBeenCalledWith({
      where: { email: dto.email },
    });

    // Verifica que el teléfono se normalizó antes de crear/guardar.
    expect(fakeCustomerRepo.create).toHaveBeenCalledWith({
      ...dto,
      phone: '5512345678',
    });

    // Verifica que save recibió la entidad creada.
    expect(fakeCustomerRepo.save).toHaveBeenCalledWith(createdEntity);

    // Verifica resultado final.
    expect(result).toEqual(savedEntity);
  });

  it('createCustomerService → lanza EMAIL_IN_USE si ya existe un customer con ese email', async () => 
  {
    // Repo falso de Customer.
    const fakeCustomerRepo = createCustomerRepoMock();

    // Inyecta repo falso cuando se solicite Customer.
    mockGetRepository.mockImplementation((entity) => {
      if (entity === Customer) return fakeCustomerRepo;
      throw new Error('Unexpected entity');
    });

    // DTO de entrada con email repetido.
    const dto = {
      name: 'Juan',
      email: 'repetido@example.com',
      phone: '55 1234-5678',
      address: 'CDMX',
      active: true,
    };

    // Simula que ya existe un registro con ese email.
    fakeCustomerRepo.findOne.mockResolvedValue({ customer_id: 'c1' });

    // Espera que el service rechace con un error tipificado (message + code).
    await expect(createCustomerService(dto as any)).rejects.toMatchObject({
      message: 'EMAIL_IN_USE',
      code: 'EMAIL_IN_USE',
    });

    // Si hay email duplicado, el service no debe crear ni guardar.
    expect(fakeCustomerRepo.create).not.toHaveBeenCalled();
    expect(fakeCustomerRepo.save).not.toHaveBeenCalled();
  });


  // =====================================================================
  // updateCustomerService
  // =====================================================================
  it('updateCustomerService → devuelve null si el customer no existe', async () => 
  {
    // Repo falso de Customer.
    const fakeCustomerRepo = createCustomerRepoMock();

    // Inyecta repo falso cuando se solicite Customer.
    mockGetRepository.mockImplementation((entity) => {
      if (entity === Customer) return fakeCustomerRepo;
      throw new Error('Unexpected entity');
    });

    // Simula "customer no existe".
    fakeCustomerRepo.findOneBy.mockResolvedValue(null);

    // DTO de actualización.
    const dto = { name: 'Nuevo nombre' };

    // Ejecuta service.
    const result = await updateCustomerService('no-existe', dto as any);

    // Verifica que se intentó buscar por id.
    expect(fakeCustomerRepo.findOneBy).toHaveBeenCalledWith({
      customer_id: 'no-existe',
    });

    // Debe retornar null para que el controller responda 404.
    expect(result).toBeNull();
  });

  it('updateCustomerService → actualiza datos y normaliza teléfono si viene en el DTO', async () => 
  {
    // Repo falso de Customer.
    const fakeCustomerRepo = createCustomerRepoMock();

    // Inyecta repo falso cuando se solicite Customer.
    mockGetRepository.mockImplementation((entity) => {
      if (entity === Customer) return fakeCustomerRepo;
      throw new Error('Unexpected entity');
    });

    // Customer existente en "BD".
    const existing = {
      customer_id: 'c1',
      name: 'Viejo nombre',
      email: 'old@example.com',
      phone: '5511112222',
      address: 'Address',
      active: true,
    };

    // Simula que el customer sí existe.
    fakeCustomerRepo.findOneBy.mockResolvedValue(existing);

    // Simula que no hay otro customer con el nuevo email.
    // (El service normalmente usa findOne para verificar unicidad de email).
    fakeCustomerRepo.findOne.mockResolvedValue(null);

    // DTO de actualización: cambia email y phone.
    const dto = {
      email: 'nuevo@example.com',
      phone: '+52 (55) 9999-8888',
    };

    // "saved" representa el objeto final esperado tras normalización.
    // Nota: aquí guardas phone con '+'; la lógica exacta depende de tu normalizador.
    const saved = {
      ...existing,
      ...dto,
      phone: '+525599998888', // normalizado por la función interna
    };

    // Mock de save: retorna la misma entidad que recibe (patrón común en unit tests).
    fakeCustomerRepo.save.mockImplementation(async (entity) => entity);

    // Ejecuta el service.
    const result = await updateCustomerService('c1', dto as any);

    // Validamos que el resultado del service sea exactamente el objeto esperado.
    // También evita el warning de SonarQube (S1854) porque `saved` deja de ser una variable sin uso.
    expect(result).toEqual(saved);

    // Verifica que, si se intenta cambiar email, se comprueba que no exista duplicado.
    expect(fakeCustomerRepo.findOne).toHaveBeenCalledWith({
      where: { email: dto.email },
    });

    // Verifica que el teléfono fue normalizado antes de guardar.
    expect(fakeCustomerRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '+525599998888',
      })
    );

    // Verifica que el resultado contiene los cambios esperados.
    expect(result).toEqual(
      expect.objectContaining({
        customer_id: 'c1',
        email: 'nuevo@example.com',
        phone: '+525599998888',
      })
    );
  });

  it('updateCustomerService → lanza EMAIL_IN_USE si el nuevo email ya está en uso por otro customer', async () => 
  {
    // Repo falso de Customer.
    const fakeCustomerRepo = createCustomerRepoMock();

    // Inyecta repo falso cuando se solicite Customer.
    mockGetRepository.mockImplementation((entity) => {
      if (entity === Customer) return fakeCustomerRepo;
      throw new Error('Unexpected entity');
    });

    // Customer existente.
    const existing = {
      customer_id: 'c1',
      name: 'Viejo nombre',
      email: 'old@example.com',
    };

    // Simula que el customer sí existe.
    fakeCustomerRepo.findOneBy.mockResolvedValue(existing);

    // DTO: email nuevo que ya está en uso.
    const dto = {
      email: 'usado@example.com',
    };

    // Simula que existe OTRO customer con ese email.
    fakeCustomerRepo.findOne.mockResolvedValue({
      customer_id: 'otro',
      email: 'usado@example.com',
    });

    // Se espera que el service lance error tipificado EMAIL_IN_USE.
    await expect(updateCustomerService('c1', dto as any)).rejects.toMatchObject(
      {
        message: 'EMAIL_IN_USE',
        code: 'EMAIL_IN_USE',
      }
    );

    // Si hay conflicto de email, no debe guardar cambios.
    expect(fakeCustomerRepo.save).not.toHaveBeenCalled();
  });


  // =====================================================================
  // deleteCustomerService
  // =====================================================================
  it('deleteCustomerService → devuelve 0 si el customer no existe', async () => 
  {
    // Repo falso de Customer.
    const fakeCustomerRepo = createCustomerRepoMock();

    // Repo falso de Payment (para la verificación de pagos).
    const fakePaymentRepo = createPaymentRepoMock();

    // getRepository debe devolver repos distintos según la entidad solicitada.
    mockGetRepository.mockImplementation((entity) => {
      if (entity === Customer) return fakeCustomerRepo;
      if (entity === Payment) return fakePaymentRepo;
      throw new Error('Unexpected entity');
    });

    // Simula que el customer no existe.
    fakeCustomerRepo.findOneBy.mockResolvedValue(null);

    // Ejecuta delete.
    const result = await deleteCustomerService('no-existe');

    // Verifica que se intentó buscar el customer por id.
    expect(fakeCustomerRepo.findOneBy).toHaveBeenCalledWith({
      customer_id: 'no-existe',
    });

    // Si no existe, el service retorna 0 (sin intentar borrar).
    expect(result).toBe(0);
  });

  it('deleteCustomerService → lanza CUSTOMER_HAS_ACTIVE_PAYMENTS si hay pagos pendientes', async () => 
  {
    // Repo falso de Customer.
    const fakeCustomerRepo = createCustomerRepoMock();

    // Repo falso de Payment.
    const fakePaymentRepo = createPaymentRepoMock();

    // Inyecta repos según entidad.
    mockGetRepository.mockImplementation((entity) => {
      if (entity === Customer) return fakeCustomerRepo;
      if (entity === Payment) return fakePaymentRepo;
      throw new Error('Unexpected entity');
    });

    // Simula que el customer existe.
    fakeCustomerRepo.findOneBy.mockResolvedValue({ customer_id: 'c1' });

    // Simula que tiene 2 pagos pendientes (status = pending).
    fakePaymentRepo.count.mockResolvedValue(2);

    // Se espera que el service bloquee el delete y lance error tipificado.
    await expect(deleteCustomerService('c1')).rejects.toMatchObject({
      message: 'CUSTOMER_HAS_ACTIVE_PAYMENTS',
      code: 'CUSTOMER_HAS_ACTIVE_PAYMENTS',
    });

    // Si hay pagos activos, no debe intentar borrar el customer.
    expect(fakeCustomerRepo.delete).not.toHaveBeenCalled();
  });

  it('deleteCustomerService → borra y devuelve filas afectadas si no hay pagos pendientes', async () => 
  {
    // Repo falso de Customer.
    const fakeCustomerRepo = createCustomerRepoMock();

    // Repo falso de Payment.
    const fakePaymentRepo = createPaymentRepoMock();

    // Inyecta repos según entidad.
    mockGetRepository.mockImplementation((entity) => {
      if (entity === Customer) return fakeCustomerRepo;
      if (entity === Payment) return fakePaymentRepo;
      throw new Error('Unexpected entity');
    });

    // Simula que el customer existe.
    fakeCustomerRepo.findOneBy.mockResolvedValue({ customer_id: 'c1' });

    // Simula que no hay pagos pendientes.
    fakePaymentRepo.count.mockResolvedValue(0);

    // Simula delete exitoso: TypeORM suele retornar { affected: number }.
    fakeCustomerRepo.delete.mockResolvedValue({ affected: 1 });

    // Ejecuta delete.
    const result = await deleteCustomerService('c1');

    // Verifica que se contó pagos pendientes del customer.
    expect(fakePaymentRepo.count).toHaveBeenCalledWith({
      where: {
        customer_id: 'c1',
        status: 'pending',
      },
    });

    // Verifica que se ejecutó delete por id.
    expect(fakeCustomerRepo.delete).toHaveBeenCalledWith({
      customer_id: 'c1',
    });

    // Debe retornar cantidad de filas afectadas (1).
    expect(result).toBe(1);
  });
});