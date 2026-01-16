// Importa la función createDefaultPreset desde el paquete "ts-jest".
// ts-jest es el puente que permite a Jest entender y ejecutar archivos TypeScript.
const { createDefaultPreset } = require('ts-jest');

// Ejecuta createDefaultPreset() para obtener la configuración por defecto de ts-jest
// y extrae únicamente la propiedad "transform", que indica cómo transformar los archivos .ts/.tsx.
const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import('jest').Config} */
// Comentario JSDoc: le dice al editor/TypeScript que el objeto exportado
// debe seguir la forma de "jest.Config". Esto da autocompletado y validación de tipos.
module.exports = {
  // testEnvironment indica en qué entorno se ejecutarán los tests.
  // "node" significa que Jest usará un entorno similar a Node.js (sin DOM, sin navegador).
  testEnvironment: 'node',

  // Sección de configuración para transformar archivos antes de que Jest los ejecute.
  // Aquí le decimos a Jest que use la config de transformación generada por ts-jest.
  transform: {
    // Copiamos (spread) todas las reglas de transform de tsJestTransformCfg.
    // Esto hace que todos los archivos .ts / .tsx se compilen con ts-jest.
    ...tsJestTransformCfg,
  },

  // testMatch define los patrones de archivos donde Jest buscará tests.
  // Es un arreglo de glob patterns.
  testMatch: [
    // Busca archivos que terminen en .spec.ts o .test.ts dentro de carpetas "__tests__".
    '**/__tests__/**/*.spec.ts',
    // Igual que el anterior pero para nombres que terminen en .test.ts.
    '**/__tests__/**/*.test.ts',
    // Patrón más genérico: cualquier archivo que termine en .spec.ts o .test.ts
    // en cualquier carpeta del proyecto.
    '**/?(*.)+(spec|test).ts',
  ],

  // moduleNameMapper permite a Jest resolver alias de módulos.
  // Aquí hacemos que los imports que empiezan por "@/..."
  // se resuelvan a la carpeta "src/..." del proyecto.
  moduleNameMapper: {
    // La expresión regular '^@/(.*)$' captura cualquier ruta que empiece con "@/".
    // El grupo (.*) toma el resto de la ruta.
    '^@/(.*)$': '<rootDir>/src/$1',
    // '<rootDir>' es la raíz del proyecto donde está jest.config.js.
    // '$1' inserta lo capturado por (.*), de modo que "@/modules/..." → "src/modules/...".
  },

  // clearMocks: true indica que Jest limpiará automáticamente
  // todos los mocks entre cada test.
  // Esto evita que un test afecte a otro por compartir el mismo mock.
  clearMocks: true,
};