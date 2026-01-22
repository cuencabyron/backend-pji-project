// Importa Request y Response de Express para tipar correctamente los mocks y las llamadas a los controllers.
import { Request, Response } from 'express';

// Importa los handlers (controllers) que se van a probar.
// Representan endpoints CRUD del recurso Payment.
import {
  listPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
} from '@/modules/payment/payment.controller';

// Importa las funciones del service.
// Se importan para poder:
// 1) Mockear el módulo completo con jest.mock
// 2) Castear cada función a jest.Mock y controlar su comportamiento por test
import {
  findAllPayments,
  findPaymentById,
  createPaymentService,
  updatePaymentService,
  deletePaymentService,
} from '@/modules/payment/payment.service';

// Mock del módulo payment.service.
// Reemplaza todas las funciones reales del service por jest.fn(), aislando el controller de DB/ORM.
jest.mock('@/modules/payment/payment.service', () => (
{
  // Mock de listar todos los pagos.
  findAllPayments: jest.fn(),

  // Mock de obtener un pago por ID.
  findPaymentById: jest.fn(),

  // Mock de crear un pago.
  createPaymentService: jest.fn(),

  // Mock de actualizar un pago.
  updatePaymentService: jest.fn(),

  // Mock de eliminar un pago.
  deletePaymentService: jest.fn(),
}));

// Fabrica un Response falso de Express para usar en pruebas unitarias.
// Implementa status/json/send como mocks y soporta chaining: res.status(...).json(...)
function createMockResponse(): Response  
{
  // Objeto parcial para ir “completando” solo lo que necesitamos en tests.
  const res: Partial<Response> = {};

  // Mock de res.status: guarda llamadas y retorna res para permitir encadenamiento.
  res.status = jest.fn().mockReturnValue(res);

  // Mock de res.json: guarda llamadas y retorna res para permitir encadenamiento.
  res.json = jest.fn().mockReturnValue(res);

  // Mock de res.send: guarda llamadas y retorna res para permitir encadenamiento.
  res.send = jest.fn().mockReturnValue(res);

  // Casteo final a Response para que sea compatible con los controllers.
  return res as Response;
}

// Agrupa las pruebas del PaymentController.
describe('PaymentController', () => 
{
  // Se ejecuta antes de cada test.
  // Limpia todos los mocks para evitar acumulación de llamadas o configuraciones.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Aliases tipados como jest.Mock para poder usar mockResolvedValue/mockRejectedValue.
  const mockFindAllPayments = findAllPayments as jest.Mock;
  const mockFindPaymentById = findPaymentById as jest.Mock;
  const mockCreatePaymentService = createPaymentService as jest.Mock;
  const mockUpdatePaymentService = updatePaymentService as jest.Mock;
  const mockDeletePaymentService = deletePaymentService as jest.Mock;

  // =========================================================
  //           listPayments (GET /api/payments)
  // =========================================================
  it('GET listPayments → 200 y devuelve arreglo de payments', async () => 
  {
    // Arreglo simulado de payments que devolvería el service en un caso exitoso.
    const fakePayments = [
      {
        // ID del payment simulado.
        payment_id: 'pay-1',

        // Relación con customer (FK lógica).
        customer_id: 'cust-1',

        // Monto pagado.
        amount: 3500,

        // Moneda del pago.
        currency: 'MXN',

        // Método de pago (ej: card, cash, transfer).
        method: 'card',

        // Estado del pago (paid/pending/failed, etc.).
        status: 'paid',

        // Referencia externa (ej: folio pasarela/TPV).
        external_ref: 'ABC123',
      },
    ];

    // Configura el mock para que el service resuelva exitosamente con fakePayments.
    mockFindAllPayments.mockResolvedValue(fakePayments);

    // Request vacío: listPayments no requiere params/body en este test.
    const req = {} as Request;

    // Response mock para verificar lo que responde el controller.
    const res = createMockResponse();

    // Ejecuta el controller.
    await listPayments(req, res);

    // Verifica que el service fue llamado una vez.
    expect(mockFindAllPayments).toHaveBeenCalledTimes(1);

    // Verifica que el controller devolvió la lista en JSON.
    expect(res.json).toHaveBeenCalledWith(fakePayments);
  });

  it('GET listPayments → 500 si el servicio lanza error', async () => 
  {
    // Spy a console.error para evitar que el test imprima ruido en consola.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Configura el service para fallar (simula error de DB).
    mockFindAllPayments.mockRejectedValue(new Error('DB error'));

    // Request vacío.
    const req = {} as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await listPayments(req, res);

    // Debe responder status 500 (Internal Server Error).
    expect(res.status).toHaveBeenCalledWith(500);

    // Debe responder JSON con mensaje controlado.
    expect(res.json).toHaveBeenCalledWith({message: 'Error listando payments',});

    // Restaura console.error original.
    consoleSpy.mockRestore();
  });

  // ============================================================================
  //                    getPayment (GET /api/payments/:id)
  // ============================================================================
  it('GET getPayment → 200 si encuentra el payment', async () => 
  {
    // Payment simulado para devolver cuando existe.
    const fakePayment = {
      payment_id: 'pay-1',
      customer_id: 'cust-1',
      amount: 3500,
      currency: 'MXN',
      method: 'card',
      status: 'paid',
      external_ref: 'ABC123',
    };

    // Configura el service para devolver el payment.
    mockFindPaymentById.mockResolvedValue(fakePayment);

    // Request simulado con params.id.
    const req = {
      params: { id: 'pay-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getPayment(req, res);

    // Verifica que el controller pidió al service el ID correcto.
    expect(mockFindPaymentById).toHaveBeenCalledWith('pay-1');

    // Verifica que devolvió el payment en JSON.
    expect(res.json).toHaveBeenCalledWith(fakePayment);
  });

  it('GET getPayment → 404 si no existe', async () => 
  {
    // Configura el service para devolver null (simula "no encontrado").
    mockFindPaymentById.mockResolvedValue(null);

    // Request con id inexistente.
    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getPayment(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Debe responder mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Payment no encontrado',
    });
  });

  it('GET getPayment → 500 si el servicio lanza error', async () => 
  {
    // Spy a console.error para suprimir salida.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Configura el service para fallar con un error genérico.
    mockFindPaymentById.mockRejectedValue(new Error('Fallo raro'));

    // Request con id válido.
    const req = {
      params: { id: 'pay-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await getPayment(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Debe responder mensaje de error controlado.
    expect(res.json).toHaveBeenCalledWith({message: 'Error obteniendo payment',});

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  // ============================================================================
  //                    createPayment (POST /api/payments)
  // ============================================================================
  it('POST createPayment → 201 cuando se crea correctamente', async () => 
  {
    // Body válido de creación.
    const body = {
      customer_id: 'cust-1',
      amount: 3500,
      currency: 'MXN',
      method: 'card',
      status: 'paid',
      external_ref: 'ABC123',
    };

    // Simula el objeto ya persistido (con payment_id asignado).
    const saved = {
      payment_id: 'pay-1',
      ...body,
    };

    // Configura el service para devolver "saved" al crear.
    mockCreatePaymentService.mockResolvedValue(saved);

    // Request con body.
    const req = { body } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createPayment(req, res);

    // Verifica que el controller mandó al service exactamente el body.
    expect(mockCreatePaymentService).toHaveBeenCalledWith(body);

    // Verifica status 201 (Created).
    expect(res.status).toHaveBeenCalledWith(201);

    // Verifica que devolvió el objeto creado.
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('POST createPayment → 400 si faltan campos obligatorios', async () => 
  {
    // Request con body incompleto: falta method (comentado).
    const req = {
      body: {
        customer_id: 'cust-1',
        amount: 35000,
        currency: 'MXN',

        // Campo requerido faltante para probar validación del controller.
        //method: 'card', 

        status: 'paid',
        external_ref: 'PAY-001-TPV'
      },
    } as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createPayment(req, res);

    // Debe responder 400 por validación.
    expect(res.status).toHaveBeenCalledWith(400);

    // Debe responder mensaje de validación.
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id, amount y method son requeridos',
    });

    // El service NO debe ser llamado cuando la validación falla.
    expect(mockCreatePaymentService).not.toHaveBeenCalled();
  });

  it('POST createPayment → 400 si CUSTOMER_NOT_FOUND', async () => 
  {
    // Body con customer_id inexistente (simula FK inválida).
    const body = {
      customer_id: 'cust-no',

      // Nota: aquí amount es string ('100.00'), lo cual depende de tu controller/service.
      // Si tu dominio espera number, esto podría ser una inconsistencia aceptada por tu implementación.
      amount: '100.00',
      currency: 'MXN',
      method: 'card',
      status: 'pending',
      external_ref: 'ABC123',
    };

    // Error tipificado que el service lanzaría cuando el customer no existe.
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';

    // Configura el service para rechazar con ese error.
    mockCreatePaymentService.mockRejectedValue(error);

    // Request con body.
    const req = { body } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createPayment(req, res);

    // El controller mapea CUSTOMER_NOT_FOUND a 400 (Bad Request) según tus reglas.
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje específico de validación de FK/relación.
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe en la BD',
    });
  });

  it('POST createPayment → 500 en error inesperado', async () => 
  {
    // Spy a console.error para suprimir salida.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Body de ejemplo para crear.
    const body = {
      customer_id: 'cust-1',
      amount: '100.00',
      currency: 'MXN',
      method: 'card',
      status: 'pending',
      external_ref: 'ABC123',
    };

    // Error genérico inesperado del service.
    mockCreatePaymentService.mockRejectedValue(new Error('Error inesperado'));

    // Request con body.
    const req = { body } as Request;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await createPayment(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Debe responder mensaje estable.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error creando payment',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  // =========================================================
  //         updatePayment (PUT /api/payments/:id)
  // =========================================================
  it('PUT updatePayment → 200 cuando se actualiza correctamente', async () => 
  {
    // Body válido para actualización.
    const body = {
      customer_id: 'cust-1',
      amount: '150.00',
      currency: 'USD',
      method: 'card',
      status: 'paid',
      external_ref: 'XYZ999',
    };

    // Objeto actualizado simulado (con id).
    const updated = {
      payment_id: 'pay-1',
      ...body,
    };

    // Configura el service para devolver el payment actualizado.
    mockUpdatePaymentService.mockResolvedValue(updated);

    // Request con params.id y body de actualización.
    const req = {
      params: { id: 'pay-1' },
      body,
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updatePayment(req, res);

    // Verifica que el controller llamó al service con el id y body esperados.
    expect(mockUpdatePaymentService).toHaveBeenCalledWith('pay-1', body);

    // Verifica que devolvió el objeto actualizado en JSON (200 implícito).
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('PUT updatePayment → 404 si no existe', async () => 
  {
    // Configura el service para devolver null (no encontrado).
    mockUpdatePaymentService.mockResolvedValue(null);

    // Request con id inexistente.
    const req = {
      params: { id: 'no-existe' },
      body: {},
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updatePayment(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Debe responder mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Payment no encontrado',
    });
  });

  it('PUT updatePayment → 400 si CUSTOMER_NOT_FOUND', async () => 
  {
    // Error tipificado: customer_id enviado no existe.
    const error: any = new Error('Customer no encontrado');
    error.code = 'CUSTOMER_NOT_FOUND';

    // Configura el service para rechazar con el error tipificado.
    mockUpdatePaymentService.mockRejectedValue(error);

    // Request intentando actualizar el payment con un customer_id inválido.
    const req = {
      params: { id: 'pay-1' },
      body: { customer_id: 'cust-no' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updatePayment(req, res);

    // Mapea a 400 según tu regla (entrada inválida).
    expect(res.status).toHaveBeenCalledWith(400);

    // Mensaje específico.
    expect(res.json).toHaveBeenCalledWith({
      message: 'customer_id no existe en la BD',
    });
  });

  it('PUT updatePayment → 500 en error inesperado', async () => 
  {
    // Spy a console.error para suprimir salida.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // Error genérico inesperado del service.
    mockUpdatePaymentService.mockRejectedValue(new Error('Fallo raro'));

    // Request de actualización mínima.
    const req = {
      params: { id: 'pay-1' },
      body: {},
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await updatePayment(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje estable para error.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error actualizando payment',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });

  // =========================================================
  //         deletePayment (DELETE /api/payments/:id)
  // =========================================================
  it('DELETE deletePayment → 204 cuando se elimina correctamente', async () => 
  {
    // El service devuelve 1 (una fila afectada) para indicar eliminación exitosa.
    mockDeletePaymentService.mockResolvedValue(1);

    // Request con id a eliminar.
    const req = {
      params: { id: 'pay-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deletePayment(req, res);

    // Verifica que llamó al service con el id correcto.
    expect(mockDeletePaymentService).toHaveBeenCalledWith('pay-1');

    // Debe responder 204 No Content.
    expect(res.status).toHaveBeenCalledWith(204);

    // Debe finalizar la respuesta sin body.
    expect(res.send).toHaveBeenCalled();
  });

  it('DELETE deletePayment → 404 si no se elimina nada', async () => 
  {
    // El service devuelve 0 (cero filas afectadas): no existía el payment.
    mockDeletePaymentService.mockResolvedValue(0);

    // Request con id inexistente.
    const req = {
      params: { id: 'no-existe' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deletePayment(req, res);

    // Debe responder 404.
    expect(res.status).toHaveBeenCalledWith(404);

    // Mensaje de no encontrado.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Payment no encontrado',
    });
  });

  it('DELETE deletePayment → 500 en error inesperado', async () => 
  {
    // Spy a console.error para suprimir salida.
    const consoleSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}); // no imprime nada

    // El service rechaza con error genérico.
    mockDeletePaymentService.mockRejectedValue(new Error('Error delete'));

    // Request con id válido.
    const req = {
      params: { id: 'pay-1' },
    } as unknown as Request<{ id: string }>;

    // Response mock.
    const res = createMockResponse();

    // Ejecuta el controller.
    await deletePayment(req, res);

    // Debe responder 500.
    expect(res.status).toHaveBeenCalledWith(500);

    // Mensaje estable para error en eliminación.
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error eliminando payment',
    });

    // Restaura console.error.
    consoleSpy.mockRestore();
  });
});