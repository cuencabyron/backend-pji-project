import 'dotenv/config';
import 'reflect-metadata';
import app from '@/app';
import { AppDataSource } from '@/config/data-source';

const PORT = +(process.env.PORT ?? 4000);

function start() {
  try {
    AppDataSource.initialize();
    console.log('DB conectada con TypeORM');
    app.listen(PORT, () => {
      console.log(`API escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error inicializando DataSource:', err);
    process.exit(1);
  }
}
start();