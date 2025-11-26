// Importa la instancia de conexión/configuración de TypeORM (DataSource)
// que se creo en src/data-source.ts
import { AppDataSource } from '../data-source';

// Importa la entidad que mapea la tabla "service"
import { Verification } from '../entities/Verification';

// Exporta una pequeña “factory” (función) que devuelve el repositorio de Verification.
// Usar función (y no una variable global) evita problemas en tests/CLI cuando
// el DataSource se reinicializa, y facilita el mock en pruebas.
export const verificationRepo = () => AppDataSource.getRepository(Verification);