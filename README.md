<h1 align="center">Backend – Portal PJI Project</h1>

---

API backend del proyecto **Portal PJI Project**, desarrollada con:

- **Node.js**
- **Express**
- **TypeScript**
- **TypeORM**
- **MySQL / MariaDB**
- (Opcional) `express-validator` para validaciones

Su objetivo es exponer una API REST para gestionar clientes, sesiones, servicios, pagos y verificaciones.

---

## Características principales

- Arquitectura organizada por capas:
  - **Entities (TypeORM)** para el mapeo a la base de datos.
  - **Repositories** para el acceso a datos.
  - **Services** para la lógica de negocio.
  - **Controllers** para la capa HTTP.
  - **Routes** para el registro de endpoints.
  - **Middlewares** para validaciones y manejo transversal.
- Conexión a MySQL/MariaDB mediante:
  - **TypeORM** (`AppDataSource`)
  - Pool nativo de `mysql2/promise` para consultas puntuales.
- Validación de IDs con formato **UUID**.
- Manejo básico de errores con `try/catch` y respuestas JSON estandarizadas.
- Preparado para añadir pruebas con **Jest**.

---

## Estructura de carpetas

```txt
backend/
├─ node_modules/           # Dependencias instaladas (npm install)
├─ src/
│  ├─ config/              # Configuración de infraestructura (BD, env)
│  ├─ controllers/         # Controladores HTTP (capa API)
│  ├─ db/                  # Código de BD de bajo nivel (si se usa)
│  ├─ entities/            # Entidades TypeORM (tablas y relaciones)
│  ├─ middlewares/         # Middlewares de Express (validaciones, etc.)
│  ├─ repositories/        # Repositorios de acceso a datos
│  ├─ routes/              # Definición de rutas y montaje de controladores
│  ├─ services/            # Lógica de negocio
│  ├─ utils/               # Funciones auxiliares reutilizables
│  ├─ app.ts               # Configuración de la app Express
│  └─ server.ts            # Punto de entrada del servidor (listen)
├─ tests/                  # Pruebas unitarias / integración
├─ .env                    # Variables de entorno (NO se versiona)
├─ .env.example            # Ejemplo de configuración de entorno
├─ .gitignore              # Archivos/carpeta ignorados por git
├─ jest.config.js          # Configuración de Jest
├─ package.json            # Scripts y dependencias del proyecto
├─ package-lock.json       # Versiones bloqueadas de dependencias
└─ tsconfig.json           # Configuración de TypeScript