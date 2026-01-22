// Importa únicamente los tipos Request y Response de Express para tipar los mocks y llamadas al controller.
import type { Request, Response } from 'express';

// Importa los handlers (controladores) que serán probados.
// Cada uno representa un endpoint típico CRUD para customers.
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/modules/customer/customer.controller';

// Importa las funciones del service.
// Aunque se van a mockear, se importan para:
// 1) Que Jest sustituya el módulo completo con jest.mock
// 2) Poder castear a jest.Mock y configurar mockResolvedValue / mockRejectedValue por test
import {
  findAllCustomers,
  findCustomerById,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
} from '@/modules/customer/customer.service';

// Mock del módulo customer.service.
// Reemplaza todas las funciones del service por jest.fn() (mocks) para aislar el controller de DB/ORM.
jest.mock('@/modules/customer/customer.service', () => (
{
  // Mock de la función que lista customers.
  findAllCustomers: jest.fn(),

  // Mock de la función que obtiene un customer por id.
  findCustomerById: jest.fn(),

  // Mock de la función que crea un customer.
  createCustomerService: jest.fn(),

  // Mock de la función que actualiza un customer.
  updateCustomerService: jest.fn(),

  // Mock de la función que elimina un customer.
  deleteCustomerService: jest.fn(),
}));

// Crea un Response de Express "falso" (mock) para las pruebas.
// Permite simular res.status(...).json(...) y res.send() sin levantar un servidor real.
function createMockResponse(): Response 
{
  // Se usa Partial<Response> para poder crear un objeto incompleto y luego "completarlo" con mocks.
  const res: Partial<Response> = {};

  // Mock de res.status: registra llamadas y devuelve "res" para permitir encadenamiento (chaining).
  res.status = jest.fn().mockReturnValue(res);

  // Mock de res.json: registra llamadas y devuelve "res" para permitir encadenamiento.
  res.json = jest.fn().mockReturnValue(res);

  // Mock de res.send: registra llamadas y devuelve "res" para permitir encadenamiento.
  res.send = jest.fn().mockReturnValue(res);

  // Se castea a Response para cumplir el tipo esperado por los controllers.
  return res as Response;
}

// Agrupa todas las pruebas del CustomerController.
describe('CustomerController', () => 
{
  // Se ejecuta antes de cada test.
  // Limpia el estado de todos los mocks para que no se acumulen llamadas entre pruebas.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Casteos a jest.Mock para poder usar helpers de Jest:
  // mockResolvedValue, mockRejectedValue, etc.
  const mockedFindAll = findAllCustomers as jest.Mock;
  const mockedFindById = findCustomerById as jest.Mock;
  const mockedCreate = createCustomerService as jest.Mock;
  const mockedUpdate = updateCustomerService as jest.Mock;
  const mockedDelete = deleteCustomerService as jest.Mock;

  // ============================================================================
  //                    listCustomers (GET /api/customers)
  // ============================================================================
  it('GET listCustomers → 200 con arreglo de customers', async () => 
  {
    // Datos simulados que el service devolvería (lista de customers).
    const fakeCustomers = [
      { 
        // Id simulado del customer.
        customer_id: 'cust-1', 

        // Nombre simulado del customer.
        name: 'Byron Cuenca' 
      },
    ];

    // Configura el mock del service para que resuelva con fakeCustomers (caso éxito).
    mockedFindAll.mockResolvedValue(fakeCustomers);

    // Crea un Response mock para inspeccionar qué respondió el controller.
    const res = createMockResponse();

    // Ejecuta el controller: Request vacío (no lo necesita) y Response mock.
    await listCustomers({} as Request, res);

    // Asegura que el service fue llamado exactamente una vez.
    expect(mockedFindAll).toHaveBeenCalledTimes(1);

    // Asegura que el controller respondió con JSON igual a fakeCustomers.
    expect(res.json).toHaveBeenCalledWith(fakeCustomers);
  });

  it('GET listCustomers → 500 si el servicio lanza error', async () => 
  {
    // Espía console.error para evitar imprimir en la salida de tests y para controlarlo.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Configura el service para que rechace con error (simula fallo de DB u otro).
    mockedFindAll.mockRejectedValue(new Error('DB error'));

    // Crea Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await listCustomers({} as Request, res);

    // Espera que el controller seteé status 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Espera que el controller devuelva un mensaje consistente para este error.
    expect(res.json).toHaveBeenCalledWith({message: 'Error listando customers',});

    // Restaura console.error al comportamiento original.
    consoleSpy.mockRestore();
  });

  // ============================================================================
  //                    getCustomer (GET /api/customers/:id)
  // ============================================================================
  it('GET getCustomer → 200 si existe', async () => 
  {
    // Customer simulado a devolver por el service.
    const fakeCustomer = 
    { 
      // Id simulado.
      customer_id: 'cust-2', 

      // Nombre simulado.
      name: 'Rafael Puente' 
    };

    // El service resuelve con el customer (caso encontrado).
    mockedFindById.mockResolvedValue(fakeCustomer);

    // Request simulado con params.id, tipado como Request<{id:string}>.
    const req = { 
      params: { id: 'cust-2' }, 
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getCustomer(req, res);

    // Verifica que el controller pidió al service el id correcto.
    expect(mockedFindById).toHaveBeenCalledWith('cust-2');

    // Verifica que devolvió el customer encontrado.
    expect(res.json).toHaveBeenCalledWith(fakeCustomer);
  });

  it('GET getCustomer → 404 si no existe', async () => 
  {
    // El service devuelve null para simular "no encontrado".
    mockedFindById.mockResolvedValue(null);

    // Request con id inexistente.
    const req = { 
      params: { id: 'cust-10' }, 
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getCustomer(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Debe responder con mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({message: 'Customer no encontrado',});
  });

  // ============================================================================
  //                    createCustomer (POST /api/customers)
  // ============================================================================
  it('POST createCustomer → 400 si faltan campos obligatorios', async () => 
  {
    // Request con body incompleto: falta phone (está comentado).
    const req = {
      body: { 
        // Campo requerido: presente.
        name: 'Maria Solis', 

        // Campo requerido: presente.
        email: 'marsolis.167@yahoo.com', 

        // Campo requerido: faltante (comentado a propósito para probar validación).
        //phone: '7774690016', 

        // Campo requerido: presente.
        address:'Linares, Nuevo León' ,
      }, 
    } as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createCustomer(req, res);

    // Debe responder 400 por body inválido.
    expect(res.status).toHaveBeenCalledWith(400);

    // Debe responder con mensaje de validación.
    expect(res.json).toHaveBeenCalledWith({
      message: 'name, email, phone, address son requeridos',
    });

    // El service no debe ser llamado si la validación falla en el controller.
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('POST createCustomer → 201 si se crea correctamente', async () => 
  {
    // Body completo y válido para crear.
    const reqBody = {
      name: 'Maria Solis',
      email: 'marsolis.167@yahoo.com',
      phone: '7774690016',
      address: 'Linares, Nuevo León',
      active: true,
    };

    // Objeto que simula lo que se devuelve tras guardar.
    // Nota: aquí customer_id está vacío; en la práctica sería generado por DB/UUID.
    const saved = { customer_id: '', ...reqBody };

    // Configura el service para devolver el objeto "guardado".
    mockedCreate.mockResolvedValue(saved);

    // Request con body válido.
    const req = { body: reqBody } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createCustomer(req, res);

    // Verifica que el controller pasó exactamente reqBody al service.
    expect(mockedCreate).toHaveBeenCalledWith(reqBody);

    // Verifica que respondió 201 (Created).
    expect(res.status).toHaveBeenCalledWith(201);

    // Verifica que devolvió el objeto creado.
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('POST createCustomer → 409 si el email ya está en uso (EMAIL_IN_USE)', async () => 
  {
    // Crea un error con code específico para simular conflicto de unicidad.
    const error: any = new Error('EMAIL_IN_USE');

    // El controller usa error.code para mapear a 409.
    error.code = 'EMAIL_IN_USE';

    // El service rechaza con ese error (simulando validación de email duplicado).
    mockedCreate.mockRejectedValue(error);

    // Request con un email ya ocupado.
    const req = {
      body: {
        name: 'Luis Chavez',
        email: 'marsolis.167@yahoo.com',
        phone: '7351980026',
        address: 'Cuautla, Morelos',
        active: true,
      },
    } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createCustomer(req, res);

    // Debe responder 409 (Conflict).
    expect(res.status).toHaveBeenCalledWith(409);

    // Debe responder con mensaje específico del caso.
    expect(res.json).toHaveBeenCalledWith({message: 'El email ya está en uso por otro customer',});
  });

  // ============================================================================
  //                   updateCustomer (PUT /api/customers/:id)
  // ============================================================================
  it('PUT updateCustomer → 200 si actualiza correctamente', async () => 
  {
    // Objeto actualizado simulado.
    const updated = { customer_id: 'cust-2', name: 'Noah Sebastian' };

    // El service resuelve con el customer actualizado.
    mockedUpdate.mockResolvedValue(updated);

    // Request con params.id y body parcial (solo name).
    const req = {
      params: { id: 'cust-2' },
      body: { name: 'Noah Sebastian' },
    } as unknown as Request<{ id: string }>;;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateCustomer(req, res);

    // Verifica que se llamó al service con:
    // - id correcto
    // - un payload que incluye todos los campos esperados (los no enviados quedan undefined)
    expect(mockedUpdate).toHaveBeenCalledWith('cust-2', {
      name: 'Noah Sebastian',
      email: undefined,
      phone: undefined,
      address: undefined,
      active: undefined,
    });

    // Verifica respuesta JSON con lo actualizado.
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('PUT updateCustomer → 404 si el customer no existe', async () => 
  {
    // El service devuelve null para simular que no existe el customer a actualizar.
    mockedUpdate.mockResolvedValue(null);

    // Request con id inexistente y un body de ejemplo.
    const req = {
      params: { id: 'cust-10' },
      body: { name: 'Andres Gómez' },
    } as unknown as Request<{ id: string }>;;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateCustomer(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Debe responder con mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Customer no encontrado',
    });
  });

  it('PUT updateCustomer → 409 si email ya está en uso', async () => 
  {
    // Error de conflicto por email duplicado.
    const error: any = new Error('EMAIL_IN_USE');

    // Código usado por el controller para mapear a 409.
    error.code = 'EMAIL_IN_USE';

    // El service rechaza con ese error.
    mockedUpdate.mockRejectedValue(error);

    // Request con intento de cambiar email a uno ya utilizado.
    const req = {
      params: { id: 'cust-10' },
      body: { email: 'marsolis.167@yahoo.com' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updateCustomer(req, res);

    // Debe responder 409.
    expect(res.status).toHaveBeenCalledWith(409);

    // Debe responder con mensaje específico.
    expect(res.json).toHaveBeenCalledWith({
      message: 'El email ya está en uso por otro customer',
    });
  });

  // ============================================================================
  //                  deleteCustomer (DELETE /api/customers/:id)
  // ============================================================================
  it('DELETE deleteCustomer → 204 si elimina correctamente', async () => 
  {
    // El service devuelve 1 para simular "1 fila afectada" (eliminación exitosa).
    mockedDelete.mockResolvedValue(1); 

    // Request con id a eliminar.
    const req = { 
      params: { id: 'cust-1' },
     } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deleteCustomer(req, res);

    // Verifica que se llamó al service con el id correcto.
    expect(mockedDelete).toHaveBeenCalledWith('cust-1');

    // Debe responder 204 (No Content).
    expect(res.status).toHaveBeenCalledWith(204);

    // Debe finalizar la respuesta (sin body).
    expect(res.send).toHaveBeenCalled();
  });

  it('DELETE deleteCustomer → 404 si no existe', async () => 
  {
    // El service devuelve 0 para simular "0 filas afectadas" (no existía).
    mockedDelete.mockResolvedValue(0);

    // Request con id inexistente.
    const req = { 
      params: { id: 'cust-10' },
     } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deleteCustomer(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Debe responder mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Customer no encontrado',
    });
  });

  it('DELETE deleteCustomer → 409 si tiene pagos activos', async () => 
  {
    // Error específico cuando el customer no puede eliminarse por regla de negocio.
    const error: any = new Error('CUSTOMER_HAS_ACTIVE_PAYMENTS');

    // Código interpretado por el controller para mapear a 409.
    error.code = 'CUSTOMER_HAS_ACTIVE_PAYMENTS';

    // El service rechaza con el error (simula regla: tiene pagos activos).
    mockedDelete.mockRejectedValue(error);

    // Request con id a eliminar.
    const req = { 
      params: { id: 'cust-1' }, 
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deleteCustomer(req, res);

    // Debe responder 409 (Conflict).
    expect(res.status).toHaveBeenCalledWith(409);

    // Debe responder mensaje específico.
    expect(res.json).toHaveBeenCalledWith({
      message: 'No se puede eliminar el customer porque tiene pagos activos.',
    });
  });
});