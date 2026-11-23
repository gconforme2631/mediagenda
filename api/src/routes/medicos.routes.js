// Rutas del módulo Médicos: /api/medicos.
import { Router } from 'express';
import { validarId } from '../middlewares/validar-id.middleware.js';
import * as medicosService from '../services/medicos.service.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(medicosService.listar());
});

router.post('/', (req, res) => {
  res.status(201).json(medicosService.crear(req.body));
});

router.get('/:id', validarId, (req, res) => {
  res.json(medicosService.obtener(Number(req.params.id)));
});

router.put('/:id', validarId, (req, res) => {
  res.json(medicosService.actualizar(Number(req.params.id), req.body));
});

router.delete('/:id', validarId, (req, res) => {
  medicosService.eliminar(Number(req.params.id));
  res.status(204).end();
});

export default router;
