/*Punto de entrada de la API.
    - Carga variables de entorno desde `.env`.
    - Inicializa el DataSource de TypeORM (conexión a la BD).
    - Arranca el servidor HTTP de Express en el puerto configurado.*/

/* Carga automáticamente las variables de entorno definidas en el archivo `.env`,
y las expone en `process.env`. No se asigna a ninguna variable porque solo
interesa el efecto secundario de la carga. */
import 'dotenv/config';      

/* Habilita el soporte de metadatos que necesitan los decoradores (TypeORM, etc.).
Debe importarse una sola vez, al inicio del proceso, antes de usar entidades
con decoradores como @Entity, @Column, etc. */
import 'reflect-metadata';

/* Importa la instancia de la aplicación Express ya configurada (middlewares,
rutas, etc.) desde `src/app.ts`. Aquí solo se encarga de arrancarla. */
import app from '@/app';

/* Importa la instancia de DataSource de TypeORM configurada en `data-source.ts`.
Esta instancia sabe cómo conectarse a la base de datos (host, puerto, usuario,
contraseña, entidades, etc.). */
import { AppDataSource } from '@/config/data-source';

// ============================================================================
// Configuración del puerto
// ============================================================================

/* Define el puerto en el que escuchará la API.
    - Si existe la variable de entorno PORT, la usa.
    - En caso contrario, usa 4000 por defecto.
 El operador `+` convierte el valor (string) a número.*/
const PORT = +(process.env.PORT ?? 4000);

// ============================================================================
// Función de arranque del servidor
// ============================================================================

function start() {
  try {
    // Inicializa el DataSource de TypeORM.
    // Esto establece la conexión con la base de datos y prepara las entidades.
    AppDataSource.initialize();

    console.log('DB conectada con TypeORM');

    // Arranca el servidor HTTP de Express en el puerto definido.
    app.listen(PORT, () => {
      console.log(`API escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    // Si ocurre algún error al inicializar el DataSource (por ejemplo,
    // credenciales incorrectas, BD caída, etc.), se registra en consola
    // y se termina el proceso con código de error 1.
    console.error('Error inicializando DataSource:', err);
    process.exit(1);
  }
}

// Llama a la función de arranque para poner en marcha la aplicación.
start();
