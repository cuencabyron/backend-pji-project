import { AppDataSource } from '@/config/data-source';
import { Product } from '@/modules/product/product.entity';
import {
  findAllProducts,
  findProductById,
  createProductService,
  updateProductService,
  deleteProductService,
} from '@/modules/product/product.service';
import { CreateProductDto } from '@/modules/product/dtos/create-product.dto';
import { UpdateProductDto } from '@/modules/product/dtos/update-product.dto';

// Mock global de AppDataSource para NO usar la BD real
jest.mock('@/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

const mockGetRepository = AppDataSource.getRepository as jest.Mock;

function createProductRepoMock() {
  return {
    find: jest.fn(),
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

describe('ProductService (unit tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // findAllProducts
  // ---------------------------------------------------------------------------
  it('findAllProducts → devuelve todos los productos', async () => 
  {
    const repo = createProductRepoMock();
    const fakeProducts: Product[] = [
      {
        product_id: 'prod-1',
        customer_id: 'cust-1',
        name: 'Plan Básico',
        description: 'Cobertura básica',
        min_monthly_rent: '100.00',
        max_monthly_rent: '300.00',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ] as Product[];

    repo.find.mockResolvedValue(fakeProducts);
    mockGetRepository.mockReturnValueOnce(repo);

    const result = await findAllProducts();

    expect(mockGetRepository).toHaveBeenCalledWith(Product);
    expect(repo.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fakeProducts);
  });


  // ---------------------------------------------------------------------------
  // findProductById
  // ---------------------------------------------------------------------------
  it('findProductById → devuelve el producto si existe', async () => 
  {
    const repo = createProductRepoMock();
    const fakeProduct = {
      product_id: 'prod-1',
    } as Product;

    repo.findOneBy.mockResolvedValue(fakeProduct);
    mockGetRepository.mockReturnValueOnce(repo);

    const result = await findProductById('prod-1');

    expect(mockGetRepository).toHaveBeenCalledWith(Product);
    expect(repo.findOne).toHaveBeenCalledWith({ product_id: 'prod-1' });
    expect(result).toEqual(fakeProduct);
  });

  it('findProductById → devuelve null si NO existe', async () => 
  {
    const repo = createProductRepoMock();

    repo.findOne.mockResolvedValue(null);
    mockGetRepository.mockReturnValueOnce(repo);

    const result = await findProductById('no-existe');

    expect(result).toBeNull();
  });


  // ---------------------------------------------------------------------------
  // createProductService
  // ---------------------------------------------------------------------------
  it('createProductService → guarda y devuelve el nuevo producto', async () => 
  {
    const repo = createProductRepoMock();

    const dto: CreateProductDto = {
      customer_id: 'cust-1',
      name: 'Plan Digital',
      description: 'Cobertura arrendamiento digital',
      min_monthly_rent: '100.00',
      max_monthly_rent: '300.00',
      active: true,
    };

    const fakeEntity = { product_id: 'prod-1', ...dto } as Product;

    repo.create.mockReturnValue(fakeEntity);
    repo.save.mockResolvedValue(fakeEntity);
    mockGetRepository.mockReturnValueOnce(repo);

    const result = await createProductService(dto);

    expect(mockGetRepository).toHaveBeenCalledWith(Product);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(fakeEntity);
    expect(result).toEqual(fakeEntity);
  });


  // ---------------------------------------------------------------------------
  // updateProductService
  // ---------------------------------------------------------------------------
  it('updateProductService → devuelve null si el producto no existe', async () => 
  {
    const repo = createProductRepoMock();

    repo.findOne.mockResolvedValue(null);
    mockGetRepository.mockReturnValueOnce(repo);

    const dto = {
      name: 'Nuevo nombre',
    };

    const result = await updateProductService('prod-99', dto as any);

    expect(result).toBeNull();
  });

  it('updateProductService → actualiza y devuelve el producto', async () => 
  {
    const repo = createProductRepoMock();
    const existing = {
      product_id: 'prod-1',
      name: 'Viejo nombre',
    } as Product;

    repo.findOne.mockResolvedValue(existing);
    repo.save.mockImplementation(async (entity: Product) => entity);
    mockGetRepository.mockReturnValueOnce(repo);

    const dto: UpdateProductDto = { name: 'Nuevo nombre', min_monthly_rent: 3500, max_monthly_rent: 9949 } as any;

    const result = await updateProductService('prod-1', dto);

    expect(repo.findOne).toHaveBeenCalledWith({ product_id: 'prod-1' });
    expect(result?.name).toBe('Nuevo nombre');
    expect(result?.active).toBe(false);
  });


  // ---------------------------------------------------------------------------
  // deleteProductService
  // ---------------------------------------------------------------------------
  it('deleteProductService → devuelve 0 si el producto no existe', async () => 
  {
    const repo = createProductRepoMock();
    repo.delete.mockResolvedValue({ affected: 0 });

    mockGetRepository.mockReturnValueOnce(repo);

    const affected = await deleteProductService('prod-99');

    expect(repo.delete).toHaveBeenCalledWith({ product_id: 'prod-99' });
    expect(affected).toBe(0);
  });

  it('deleteProductService → devuelve 1 si se borra correctamente', async () => 
  {
    const repo = createProductRepoMock();
    repo.delete.mockResolvedValue({ affected: 1 });

    mockGetRepository.mockReturnValueOnce(repo);

    const affected = await deleteProductService('prod-1');

    expect(affected).toBe(1);
  });
});