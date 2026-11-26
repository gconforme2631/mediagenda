// Rutas del módulo Citas: /api/citas.

import { Router } from 'express';

import { validarId }
  from '../middlewares/validar-id.middleware.js';

import * as citasService
  from '../services/citas.service.js';

const router = Router();

// Listar citas y aplicar filtros opcionales.
router.get('/', (req, res) => {

  res.json(
    citasService.listar(req.query)
  );

});

// Consultar disponibilidad de horarios.
router.get('/disponibilidad', (req, res) => {

  res.json(
    citasService.obtenerDisponibilidad(req.query)
  );

});

// Registrar una nueva cita.
router.post('/', (req, res) => {

  res.status(201).json(
    citasService.crear(req.body)
  );

});

// Consultar una cita por su identificador.
router.get('/:id', validarId, (req, res) => {

  res.json(
    citasService.obtener(
      Number(req.params.id)
    )
  );

});

// Actualizar una cita.
router.put('/:id', validarId, (req, res) => {

  res.json(
    citasService.actualizar(
      Number(req.params.id),
      req.body
    )
  );

});

// Cambiar el estado de una cita.
router.patch('/:id/estado', validarId, (req, res) => {

  res.json(
    citasService.cambiarEstado(
      Number(req.params.id),
      req.body
    )
  );

});

export default router;