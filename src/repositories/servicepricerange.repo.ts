/*
// Importa la instancia de conexión/configuración de TypeORM (DataSource)
// que se creo en src/data-source.ts
import { AppDataSource } from '../data-source';

// Importa la entidad que mapea la tabla "servicepricerange"
import { ServicePriceRange } from '../entities/ServicePriceRange';

// Exporta una pequeña “factory” (función) que devuelve el repositorio de Service.
// Usar función (y no una variable global) evita problemas en tests/CLI cuando
// el DataSource se reinicializa, y facilita el mock en pruebas.
export const servicepricerangeRepo = () => AppDataSource.getRepository(ServicePriceRange);
*/