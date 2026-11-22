// Errores de la aplicación: cada clase define su código HTTP y su mensaje.
export class ErrorApp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.name = this.constructor.name;
    this.status = status;
  }
}

// 400: errores por campo { campo: 'detalle' }
export class ErrorValidacion extends ErrorApp {
  constructor(errores) {
    super(400, 'Datos inválidos');
    this.errores = errores;
  }
}

// 404
export class ErrorNoEncontrado extends ErrorApp {
  constructor(mensaje = 'Recurso no encontrado') {
    super(404, mensaje);
  }
}

// 409
export class ErrorConflicto extends ErrorApp {
  constructor(mensaje) {
    super(409, mensaje);
  }
}