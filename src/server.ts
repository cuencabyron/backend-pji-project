
import 'dotenv/config';
// Importa la instancia de la aplicación Express que definiste en app.ts
import app from './app';

// Inicia el servidor HTTP de Express en el puerto definido en env.PORT
app.listen(process.env.PORT, () => {
  // Cuando el servidor arranca correctamente, muestra este mensaje en la consola
  console.log(`API escuchando en http://localhost:${process.env.PORT}`);
});