// Middlewares finales: ruta inexistente y conversión de errores al formato común.
import { ErrorApp, ErrorValidacion } from '../utils/errores.js';

// 404 para rutas no registradas
export function rutaNoEncontrada(req, res) {
  res.status(404).json({ mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

export function manejadorErrores(err, req, res, next) {
  if (res.headersSent) return next(err);

  // JSON mal formado en el cuerpo
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      mensaje: 'Datos inválidos',
      errores: { cuerpo: 'El JSON enviado no es válido' },
    });
  }

  if (err instanceof ErrorValidacion) {
    return res.status(err.status).json({ mensaje: err.message, errores: err.errores });
  }

  if (err instanceof ErrorApp) {
    return res.status(err.status).json({ mensaje: err.message });
  }

  // Restricciones de SQLite no controladas en el servicio
  if (err.code === 'ERR_SQLITE_ERROR') {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ mensaje: 'El registro ya existe' });
    }
    if (err.message.includes('FOREIGN KEY constraint failed')) {
      return res.status(409).json({ mensaje: 'El registro tiene datos relacionados' });
    }
  }

  console.error(err);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
}