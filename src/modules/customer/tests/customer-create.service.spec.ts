// 1) Mockeamos AppDataSource ANTES de importar el servicio
jest.mock('@/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import { AppDataSource } from '@/config/data-source';
import { createCustomerService } from '@/modules/customer/customer.service';
import { CreateCustomerDto } from '@/modules/customer/dtos/create-customer.dto';

// Tipamos el mock para que TypeScript no se queje
const getRepositoryMock = AppDataSource.getRepository as jest.Mock;

describe('createCustomerService', () => {
  // Repositorio "fake" que usaremos en cada prueba
  const fakeRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(() => {
    // Cada test empieza con mocks limpios
    jest.clearAllMocks();

    // Cuando el servicio llame AppDataSource.getRepository(Customer)
    // devolveremos nuestro fakeRepo
    getRepositoryMock.mockReturnValue(fakeRepo);
  });

  it('crea un customer cuando el email es único', async () => {
    // Arrange
    const dto: CreateCustomerDto = {
      name: 'Byron',
      email: 'byron@example.com',
      phone: '+52 (55) 1234-5678',
      address: 'CDMX',
      active: true,
    };

    // 1) No existe otro customer con el mismo email
    fakeRepo.findOne.mockResolvedValue(null);

    // 2) Lo que devuelve repo.create (entidad en memoria)
    const createdEntity = {
      customer_id: 'uuid-123',
      ...dto,
      phone: '+525512345678', // suponiendo que normalizePhone haga esto
    };
    fakeRepo.create.mockReturnValue(createdEntity);

    // 3) Lo que devuelve repo.save (registro ya guardado en BD)
    const savedEntity = {
      ...createdEntity,
      created_at: new Date(),
    };
    fakeRepo.save.mockResolvedValue(savedEntity);

    // Act
    const result = await createCustomerService(dto);

    // Assert
    expect(fakeRepo.findOne).toHaveBeenCalledWith({
      where: { email: dto.email },
    });

    expect(fakeRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: dto.name,
        email: dto.email,
        address: dto.address,
        // aquí comprobamos que se haya normalizado el teléfono
        phone: '+525512345678',
      }),
    );

    expect(fakeRepo.save).toHaveBeenCalledWith(createdEntity);

    // Y comprobamos que el servicio devuelve lo que guardó el repo
    expect(result).toEqual(savedEntity);
  });

  it('lanza error EMAIL_IN_USE si el email ya existe', async () => {
    // Arrange
    const dto: CreateCustomerDto = {
      name: 'Otro',
      email: 'duplicado@example.com',
      phone: '55 1111 2222',
      address: 'CDMX',
      active: true,
    };

    // Simulamos que ya hay un registro con ese email
    fakeRepo.findOne.mockResolvedValue({
      customer_id: 'existing-id',
      ...dto,
    });

    // Act + Assert
    await expect(createCustomerService(dto)).rejects.toMatchObject({
      message: 'EMAIL_IN_USE',
    });

    // Opcional: si en tu servicio pones error.code = 'EMAIL_IN_USE'
    await expect(createCustomerService(dto)).rejects.toMatchObject({
      code: 'EMAIL_IN_USE',
    });

    // Aseguramos que NO se haya intentado crear/guardar nada
    expect(fakeRepo.create).not.toHaveBeenCalled();
    expect(fakeRepo.save).not.toHaveBeenCalled();
  });
});