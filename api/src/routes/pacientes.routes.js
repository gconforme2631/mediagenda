// Rutas del módulo Pacientes: /api/pacientes.
import { Router } from 'express';
import { validarId } from '../middlewares/validar-id.middleware.js';
import * as pacientesService from '../services/pacientes.service.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(pacientesService.listar());
});

router.post('/', (req, res) => {
  res.status(201).json(pacientesService.crear(req.body));
});

router.get('/:id', validarId, (req, res) => {
  res.json(pacientesService.obtener(Number(req.params.id)));
});

router.put('/:id', validarId, (req, res) => {
  res.json(pacientesService.actualizar(Number(req.params.id), req.body));
});

router.delete('/:id', validarId, (req, res) => {
  pacientesService.eliminar(Number(req.params.id));
  res.status(204).end();
});

export default router;