// Endpoint de salud: confirma que la API está en ejecución.
import { Router } from 'express';

const router = Router();

// GET /api/salud
router.get('/', (req, res) => {
  res.json({
    estado: 'ok',
    servicio: 'mediagenda-api',
    fecha: new Date().toISOString(),
  });
});

export default router;