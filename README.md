<h1 align="center">Backend – Portal PJI Project</h1>

---

## Arquitectura del backend

Este backend está desarrollado con **Node.js**, **TypeScript**, **Express** y **TypeORM**, organizado en capas para separar responsabilidades (rutas → controladores → servicios → acceso a datos).

---

### Stack principal

- **Node.js**
  - Entorno de ejecución de todo el backend.
  - Se usa al ejecutar los scripts de `package.json`:
    - `npm run dev` → levanta el servidor Express.
    - `npm test` → ejecuta las pruebas con Jest.

- **TypeScript**
  - Todo el código fuente está en `src/` con archivos `.ts`.
  - Tipado y organización:
    - Tipos e interfaces de DTOs en `src/modules/**/create-*.dto.ts`, `update-*.dto.ts`, etc.
    - Tipos de las entidades (modelos de BD) en `src/modules/**/**.entity.ts`.
    - Tipado de controladores y middleware usando `Request`, `Response`, `NextFunction` de Express.

- **Express**
  - Framework HTTP que expone la API REST.
  - Entrypoint:
    - `src/app.ts` → crea la instancia `app`, configura middleware y rutas.
    - `src/server.ts` → inicializa la BD y arranca `app.listen(PORT)`.
  - Rutas:
    - `src/modules/**/**.routes.ts` (por ejemplo `customer.routes.ts`) definen endpoints como:
      - `GET /api/customers`
      - `GET /api/customers/:id`
      - `POST /api/customers`
      - `PUT /api/customers/:id`
      - `DELETE /api/customers/:id`
  - Middlewares:
    - Validaciones de `id` (UUID, etc.) en `src/middlewares/**`.
    - Manejo de errores de validación (por ejemplo con `express-validator`).

- **TypeORM**
  - ORM usado para mapear tablas de MySQL a clases TypeScript.
  - Configuración:
    - `src/config/data-source.ts` → instancia `AppDataSource` con:
      - tipo de BD (`mysql` / `mariadb`)
      - host, puerto, usuario, contraseña, base de datos
      - lista de entidades (`Customer`, `Session`, `Payment`, `Verification`, `Service`, etc.).
  - Entidades / modelos:
    - En `src/modules/**/**.entity.ts` (por ejemplo `customer.entity.ts`):
      - Decoradores `@Entity`, `@PrimaryGeneratedColumn`, `@Column`, `@OneToMany`, etc.
      - Representan las tablas de la BD y sus relaciones.
  - Acceso a datos (repositories):
    - En la capa de **servicios** se usa:
      ```ts
      const repo = AppDataSource.getRepository(Customer);
      const items = await repo.find();
      const one = await repo.findOneBy({ customer_id: id });
      const entity = repo.create(dto);
      const saved = await repo.save(entity);
      const result = await repo.delete({ customer_id: id });
      ```

- **Capa de servicios (Services)**
  - Encapsula la lógica de negocio sobre las entidades.
  - Ubicación: `src/modules/**/**.service.ts` (por ejemplo `customer.service.ts`).
  - Responsabilidades:
    - Consultar la BD usando TypeORM.
    - Aplicar reglas de negocio (por ejemplo, email único, normalización de datos, validaciones adicionales).
    - No conoce Express ni HTTP: solo recibe datos y devuelve resultados o lanza errores.

- **Capa de controladores (Controllers)**
  - Adapta HTTP ↔ servicios.
  - Ubicación: `src/modules/**/**.controller.ts` (por ejemplo `customer.controller.ts`).
  - Responsabilidades:
    - Leer `req.params`, `req.body`, `req.query`.
    - Llamar a los services (`findAllCustomers`, `createCustomerService`, etc.).
    - Traducir errores de negocio a códigos HTTP (400, 404, 409, 500…).
    - Enviar la respuesta con `res.status(...).json(...)` o `res.send()`.

- **DTOs (Data Transfer Objects)**
  - Definen la forma de los datos que entran/salen de la API.
  - Ubicación: `src/modules/**/create-*.dto.ts`, `update-*.dto.ts`, etc.
  - Validación (cuando se usa `class-validator` o `express-validator`):
    - Decoradores como `@IsString()`, `@IsEmail()`, `@IsOptional()`, `@MaxLength()` para validar el cuerpo de la petición.

- **Variables de entorno**
  - Leídas vía `dotenv`:
    - `import 'dotenv/config';` en `src/server.ts`.
  - Valores típicos:
    - `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
  - Archivo de ejemplo: `.env.example`.

---

### Pruebas (Jest)

- **Jest + ts-jest**
  - Configuración en `jest.config.cjs` o `jest.config.js`.
  - Tests unitarios:
    - Carpetas tipo `src/modules/**/__tests__/*.spec.ts`.
    - Se mockea `AppDataSource.getRepository` para no depender de la BD real.
  - Posibles pruebas:
    - Services: lógica de negocio (`createCustomerService`, `updateCustomerService`, etc.).
    - Controllers: endpoints usando `supertest` contra `app`.

---

### Flujo resumido de una petición

1. El cliente (frontend / Postman) hace una petición HTTP:
   - `GET /api/customers/1234`
2. **Express** resuelve la ruta definida en `customer.routes.ts`.
3. Se ejecutan middlewares (por ejemplo, validación de `id`).
4. El controlador `getCustomer` (en `customer.controller.ts`):
   - Lee el `id` (`req.params.id`).
   - Llama a `findCustomerById(id)` del **service**.
5. El service `customer.service.ts`:
   - Usa **TypeORM** (`AppDataSource.getRepository(Customer)`) para consultar la BD.
   - Aplica reglas de negocio (si es necesario).
   - Devuelve el resultado o lanza un error.
6. El controlador:
   - Mapea la respuesta/errores a HTTP (`200`, `404`, `409`, `500`, etc.).
   - Envía `res.json(...)` al cliente.
7. **Jest** puede probar cada pieza de forma aislada (services, controllers) sin levantar todo el servidor real.

---