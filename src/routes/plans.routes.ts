// Importa el Router de Express, que sirve para crear un “subconjunto” de rutas
import { Router } from 'express';

import { mysqlPool } from '../db/mysql';

// Crea una nueva instancia de router
const router = Router();

// Define una ruta GET en el path '/' de este router
// Cuando se haga GET a /api/plans (porque en app.ts montaste app.use('/api/plans', router))
// se ejecutará este callback.
router.get('/', async(_req, res) => {

  try{
    const [rows] = await mysqlPool.query(
      'SELECT code AS id, nombre AS name, precio AS price, descripcion FROM planes'
    );

    res.json(rows);
  } catch (err){
    console.error('ERROR CONSULTANDO LOS PLANES', err);
    res.status(500).json({ message: 'Erro interno consultando planes'});
  }
});

// Exporta el router como valor por defecto para poder importarlo en app.ts
// e integrarlo en la aplicación principal.
export default router;
