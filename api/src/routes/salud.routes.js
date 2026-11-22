// Endpoint de salud: confirma que la API y la base de datos responden.
import { Router } from 'express';
import { getDb } from '../config/database.js';

const router = Router();

// GET /api/salud
router.get('/', (req, res) => {
  let baseDatos = 'ok';

  try {
    getDb().prepare('SELECT 1').get();
  } catch {
    baseDatos = 'sin conexión';
  }

  res.status(baseDatos === 'ok' ? 200 : 503).json({
    estado: baseDatos === 'ok' ? 'ok' : 'error',
    servicio: 'mediagenda-api',
    baseDatos,
    fecha: new Date().toISOString(),
  });
});

export default router;