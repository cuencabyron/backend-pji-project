import { AppDataSource } from '@/config/data-source';
import { Product } from '@/modules/product/product.entity';

import {
  findAllProducts,
  findProductById,
  createProductService,
  updateProductService,
  deleteProductService,
} from '@/modules/product/product.service';

jest.mock('@/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

const mockGetRepository = AppDataSource.getRepository as jest.Mock;

function createProductRepoMock() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

describe('ProductService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ======================================================
  // findAllProducts
  // ======================================================

  it('findAllProducts → devuelve todos los productos', async () => {

    const repo = createProductRepoMock();

    mockGetRepository.mockReturnValue(repo);

    const fake = [
      { product_id: '1', name: 'Plan básico' },
      { product_id: '2', name: 'Plan premium' },
    ];

    repo.find.mockResolvedValue(fake);

    const result = await findAllProducts();

    expect(repo.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fake);

  });

  // ======================================================
  // findProductById
  // ======================================================

  it('findProductById → devuelve producto si existe', async () => {

    const repo = createProductRepoMock();
    mockGetRepository.mockReturnValue(repo);

    const fake = { product_id: '1', name: 'Plan básico' };

    repo.findOne.mockResolvedValue(fake);

    const result = await findProductById('1');

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { product_id: '1' },
    });

    expect(result).toEqual(fake);

  });

  it('findProductById → devuelve null si no existe', async () => {

    const repo = createProductRepoMock();
    mockGetRepository.mockReturnValue(repo);

    repo.findOne.mockResolvedValue(null);

    const result = await findProductById('no-existe');

    expect(result).toBeNull();

  });

  // ======================================================
  // createProductService
  // ======================================================

  it('createProductService → crea producto correctamente', async () => {

    const repo = createProductRepoMock();
    mockGetRepository.mockReturnValue(repo);

    const dto = {
      name: 'Plan básico',
      description: 'Cobertura básica',
      min_monthly_rent: '1000.000',
      max_monthly_rent: '3000.000',
      active: true,
    };

    const created = { ...dto };
    const saved = { product_id: '1', ...dto };

    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(saved);

    const result = await createProductService(dto as any);

    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(created);

    expect(result).toEqual(saved);

  });

  // ======================================================
  // updateProductService
  // ======================================================

  it('updateProductService → devuelve null si no existe', async () => {

    const repo = createProductRepoMock();
    mockGetRepository.mockReturnValue(repo);

    repo.findOne.mockResolvedValue(null);

    const result = await updateProductService('no-existe', {
      name: 'Nuevo',
    });

    expect(result).toBeNull();

  });

  it('updateProductService → actualiza producto', async () => {

    const repo = createProductRepoMock();
    mockGetRepository.mockReturnValue(repo);

    const existing = {
      product_id: '1',
      name: 'Viejo',
      description: 'Desc',
      min_monthly_rent: '1000.000',
      max_monthly_rent: '2000.000',
      active: true,
    };

    repo.findOne.mockResolvedValue(existing);

    repo.save.mockImplementation(async (entity) => entity);

    const dto = { name: 'Nuevo nombre' };

    const result = await updateProductService('1', dto);

    expect(repo.save).toHaveBeenCalled();

    expect(result).toEqual(
      expect.objectContaining({
        product_id: '1',
        name: 'Nuevo nombre',
      })
    );

  });

  // ======================================================
  // deleteProductService
  // ======================================================

  it('deleteProductService → devuelve 1 si elimina', async () => {

    const repo = createProductRepoMock();
    mockGetRepository.mockReturnValue(repo);

    repo.delete.mockResolvedValue({ affected: 1 });

    const result = await deleteProductService('1');

    expect(repo.delete).toHaveBeenCalledWith({
      product_id: '1',
    });

    expect(result).toBe(1);

  });

  it('deleteProductService → devuelve 0 si no elimina', async () => {

    const repo = createProductRepoMock();
    mockGetRepository.mockReturnValue(repo);

    repo.delete.mockResolvedValue({ affected: 0 });

    const result = await deleteProductService('no-existe');

    expect(result).toBe(0);

  });

});