// Validaciones del módulo Citas: datos del formulario.

import { ErrorValidacion } from '../utils/errores.js';

const ESTADOS = [
  'programada',
  'atendida',
  'cancelada'
];

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const FORMATO_HORA = /^(0[89]|1[0-6]):(00|30)$/;

function texto(valor) {

  return typeof valor === 'string'
    ? valor.trim().replace(/\s+/g, ' ')
    : '';

}

function identificador(valor) {

  if (
    typeof valor !== 'number' &&
    typeof valor !== 'string'
  ) {
    return null;
  }

  if (
    typeof valor === 'string' &&
    !/^\d+$/.test(valor)
  ) {
    return null;
  }

  const id = Number(valor);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;

}

function fechaValida(fecha) {

  if (!FORMATO_FECHA.test(fecha)) {
    return false;
  }

  const fechaObj = new Date(`${fecha}T00:00:00Z`);

  return (
    !Number.isNaN(fechaObj.getTime()) &&
    fechaObj.toISOString().slice(0, 10) === fecha
  );

}

function horaValida(hora) {

  return FORMATO_HORA.test(hora);

}

function normalizar(datos) {

  return {
    paciente_id: identificador(datos.paciente_id),
    medico_id: identificador(datos.medico_id),
    fecha: texto(datos.fecha),
    hora: texto(datos.hora),
    motivo: texto(datos.motivo),
    estado: datos.estado === undefined
      ? 'programada'
      : texto(datos.estado)
  };

}

function buscarErrores(cita) {

  const errores = {};

  if (!cita.paciente_id) {
    errores.paciente_id = 'Debe seleccionar un paciente';
  }

  if (!cita.medico_id) {
    errores.medico_id = 'Debe seleccionar un médico';
  }

  if (!cita.fecha) {

    errores.fecha = 'La fecha es obligatoria';

  } else if (!fechaValida(cita.fecha)) {

    errores.fecha =
      'La fecha debe ser válida y tener el formato YYYY-MM-DD';

  }

  if (!cita.hora) {

    errores.hora = 'El horario es obligatorio';

  } else if (!horaValida(cita.hora)) {

    errores.hora =
      'El horario debe estar entre las 08:00 y 16:30, en intervalos de 30 minutos';

  }

  if (!cita.motivo) {
    errores.motivo = 'El motivo es obligatorio';
  }

  if (!ESTADOS.includes(cita.estado)) {

    errores.estado =
      'El estado debe ser programada, atendida o cancelada';

  }

  return errores;

}

// Validar registro o actualización de una cita.
export function validarCita(datos = {}) {

  const cita = normalizar(datos ?? {});
  const errores = buscarErrores(cita);

  if (Object.keys(errores).length > 0) {
    throw new ErrorValidacion(errores);
  }

  return cita;

}

// Validar parámetros de consulta de disponibilidad.
export function validarDisponibilidad(datos = {}) {

  const disponibilidad = {
    paciente_id: identificador(datos.paciente_id),
    medico_id: identificador(datos.medico_id),
    fecha: texto(datos.fecha)
  };

  const errores = {};

  if (!disponibilidad.paciente_id) {
    errores.paciente_id = 'Debe seleccionar un paciente';
  }

  if (!disponibilidad.medico_id) {
    errores.medico_id = 'Debe seleccionar un médico';
  }

  if (!fechaValida(disponibilidad.fecha)) {
    errores.fecha = 'Debe ingresar una fecha válida';
  }

  if (Object.keys(errores).length > 0) {
    throw new ErrorValidacion(errores);
  }

  return disponibilidad;

}

// Validar filtros opcionales del listado.
export function validarFiltros(datos = {}) {

  const filtros = {};
  const errores = {};

  if (datos.paciente_id !== undefined) {

    filtros.paciente_id = identificador(
      datos.paciente_id
    );

    if (!filtros.paciente_id) {
      errores.paciente_id = 'Identificador no válido';
    }

  }

  if (datos.medico_id !== undefined) {

    filtros.medico_id = identificador(
      datos.medico_id
    );

    if (!filtros.medico_id) {
      errores.medico_id = 'Identificador no válido';
    }

  }

  if (datos.fecha !== undefined) {

    filtros.fecha = texto(datos.fecha);

    if (!fechaValida(filtros.fecha)) {
      errores.fecha = 'La fecha no es válida';
    }

  }

  if (datos.estado !== undefined) {

    filtros.estado = texto(datos.estado);

    if (!ESTADOS.includes(filtros.estado)) {
      errores.estado = 'El estado no es válido';
    }

  }

  if (Object.keys(errores).length > 0) {
    throw new ErrorValidacion(errores);
  }

  return filtros;

}

// Validar el cambio de estado de una cita.
export function validarEstado(datos = {}) {

  const estado = texto(datos?.estado);

  if (!ESTADOS.includes(estado)) {

    throw new ErrorValidacion({
      estado: 'El estado debe ser programada, atendida o cancelada'
    });

  }

  return estado;

}