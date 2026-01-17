// Importa la función createCustomerService desde la capa de servicios de Customer.
// Esta es la función que queremos “probar” o, al menos, verificar que existe y se puede importar.
import { createCustomerService } from '@/modules/customer/customer.service';

// Importa el DataSource principal de TypeORM.
// AppDataSource gestiona la conexión a la base de datos (config, entidades, etc.).
import { AppDataSource } from '@/config/data-source';

// Comentario general: esta suite de pruebas es un ejemplo muy simple
// para comprobar que el servicio se carga y que la conexión a la BD arranca correctamente.

// Define una *suite* de tests de Jest llamada "CustomerService".
/* Todo lo que esté dentro de este bloque describe(...) son pruebas relacionadas con CustomerService.*/
describe('CustomerService', () => {
  // beforeAll se ejecuta UNA sola vez antes de correr todos los tests de esta suite.
  // Aquí lo usamos para asegurarnos de que el DataSource de TypeORM está inicializado.
  beforeAll(async () => {
    // Verifica si AppDataSource NO está inicializado aún.
    // isInitialized es una propiedad booleana que indica si TypeORM ya abrió la conexión a la BD.
    if (!AppDataSource.isInitialized) {
      // Si no está inicializado, llamamos a initialize(), que abre la conexión a la BD.
      // Como es una operación asíncrona, usamos await.
      await AppDataSource.initialize();
    }
  });

  // afterAll se ejecuta UNA sola vez después de que hayan corrido todos los tests de esta suite.
  // Aquí lo usamos para cerrar la conexión a la base de datos y limpiar recursos.
  afterAll(async () => {
    // Verifica si AppDataSource sigue inicializado.
    // Solo tiene sentido cerrar la conexión si realmente está abierta.
    if (AppDataSource.isInitialized) {
      // Llama a destroy(), que cierra la conexión de TypeORM con la base de datos.
      // También es asíncrono, por eso usamos await.
      await AppDataSource.destroy();
    }
  });

  // Define un caso de prueba (test) individual dentro de la suite.
  // El texto 'debería estar definido createCustomerService' describe lo que esperamos.
  it('debería estar definido createCustomerService', () => {
    // expect es la función de aserción de Jest.
    // Aquí comprobamos que createCustomerService NO sea undefined ni null.
    // toBeDefined() pasa si el valor está definido (no es undefined).
    expect(createCustomerService).toBeDefined();
  }); // Fin del caso de prueba.
}); // Fin de la suite "CustomerService".