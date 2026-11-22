// Valida que el parámetro :id de la ruta sea un entero positivo.
import { ErrorValidacion } from '../utils/errores.js';

export function validarId(req, res, next) {
  const { id } = req.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return next(new ErrorValidacion({ id: 'El id debe ser un número entero positivo' }));
  }

  next();
}