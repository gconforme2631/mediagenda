// Servicio de citas: reglas de negocio sobre el repositorio.

import * as citasRepository
  from '../repositories/citas.repository.js';

import {
  validarCita,
  validarDisponibilidad,
  validarFiltros,
  validarEstado
} from '../validations/citas.validation.js';

import {
  ErrorConflicto,
  ErrorNoEncontrado,
  ErrorValidacion
} from '../utils/errores.js';

const NO_ENCONTRADO = 'Cita médica no encontrada';

//#region CONSULTAS

export function listar(datos = {}) {

  const filtros = validarFiltros(datos);

  return citasRepository.listar(filtros);

}

export function obtener(id) {

  const cita = citasRepository.buscarPorId(id);

  if (!cita) {
    throw new ErrorNoEncontrado(NO_ENCONTRADO);
  }

  return cita;

}

//#endregion

//#region REGISTRO

export function crear(datos) {

  const cita = validarCita(datos);

  // Toda nueva cita inicia como programada.
  cita.estado = 'programada';

  verificarPaciente(cita.paciente_id);
  verificarMedico(cita.medico_id);

  verificarFecha(cita.fecha);

  // Validar la hora actual del sistema.
  verificarHorario(cita.fecha, cita.hora);

  verificarDisponibilidad(cita);

  return guardarConControlConflicto(
    () => citasRepository.crear(cita)
  );

}

//#endregion

//#region ACTUALIZACION

export function actualizar(id, datos) {

  const existente = obtener(id);

  if (existente.estado !== 'programada') {

    throw new ErrorConflicto(
      'Solo se pueden modificar citas programadas'
    );

  }

  const cita = validarCita(datos);

  // El cambio de estado se realiza por su propio endpoint.
  cita.estado = existente.estado;

  verificarPaciente(cita.paciente_id);
  verificarMedico(cita.medico_id);

  verificarFecha(cita.fecha);

  verificarDisponibilidad(cita, id);

  const resultado = guardarConControlConflicto(
    () => citasRepository.actualizar(id, cita)
  );

  if (!resultado) {
    throw new ErrorNoEncontrado(NO_ENCONTRADO);
  }

  return resultado;

}

//#endregion

//#region ESTADOS

export function cambiarEstado(id, datos) {

  const cita = obtener(id);

  const estado = validarEstado(datos);

  // Permitir solicitudes repetidas sin modificar el registro.
  if (cita.estado === estado) {
    return cita;
  }

  if (cita.estado === 'atendida') {

    throw new ErrorConflicto(
      'No se puede cambiar el estado de una cita atendida'
    );

  }

  if (cita.estado === 'cancelada') {

    throw new ErrorConflicto(
      'No se puede cambiar el estado de una cita cancelada'
    );

  }

  const resultado = citasRepository.cambiarEstado(
    id,
    estado
  );

  if (!resultado) {
    throw new ErrorNoEncontrado(NO_ENCONTRADO);
  }

  return resultado;

}

//#endregion

//#region DISPONIBILIDAD

export function obtenerDisponibilidad(datos) {

  const {
    medico_id,
    paciente_id,
    fecha
  } = validarDisponibilidad(datos);

  verificarPaciente(paciente_id);
  verificarMedico(medico_id);

  verificarFecha(fecha);

  const horariosOcupados = new Set(
    citasRepository.obtenerHorariosOcupados(
      medico_id,
      paciente_id,
      fecha
    )
  );

  return generarHorarios().map(hora => {

    const transcurrido = horarioTranscurrido(
      fecha,
      hora
    );

    const ocupado = horariosOcupados.has(hora);

    return {

      hora,

      disponible: !ocupado && !transcurrido,

      transcurrido,

      ocupado

    };

  });

}

function generarHorarios() {

  const horarios = [];

  for (let hora = 8; hora <= 16; hora++) {

    for (const minuto of [0, 30]) {

      const horaTexto = String(hora)
        .padStart(2, '0');

      const minutoTexto = String(minuto)
        .padStart(2, '0');

      horarios.push(
        `${horaTexto}:${minutoTexto}`
      );

    }

  }

  return horarios;

}

function verificarDisponibilidad(
  cita,
  idActual = null
) {

  if (
    citasRepository.medicoTieneCita(
      cita.medico_id,
      cita.fecha,
      cita.hora,
      idActual
    )
  ) {

    throw new ErrorConflicto(
      'El médico ya tiene una cita registrada en el horario seleccionado'
    );

  }

  if (
    citasRepository.pacienteTieneCita(
      cita.paciente_id,
      cita.fecha,
      cita.hora,
      idActual
    )
  ) {

    throw new ErrorConflicto(
      'El paciente ya tiene una cita registrada en el horario seleccionado'
    );

  }

}

//#endregion

//#region VALIDACIONES DE NEGOCIO


function obtenerHoraActual() {

  const fecha = new Date();

  const hora = String(fecha.getHours())
    .padStart(2, '0');

  const minuto = String(fecha.getMinutes())
    .padStart(2, '0');

  return `${hora}:${minuto}`;

}


function horarioTranscurrido(fecha, hora) {

  const fechaActual = obtenerFechaActual();
  const horaActual = obtenerHoraActual();

  if (fecha < fechaActual) {
    return true;
  }

  if (fecha === fechaActual) {
    return hora <= horaActual;
  }

  return false;

}

function verificarHorario(fecha, hora) {

  if (horarioTranscurrido(fecha, hora)) {

    throw new ErrorValidacion({
      hora: 'El horario seleccionado ya ha transcurrido'
    });

  }

}

function verificarPaciente(id) {

  if (!citasRepository.existePaciente(id)) {

    throw new ErrorNoEncontrado(
      'Paciente no encontrado'
    );

  }

}

function verificarMedico(id) {

  if (!citasRepository.existeMedico(id)) {

    throw new ErrorNoEncontrado(
      'Médico no encontrado'
    );

  }

}

function verificarFecha(fecha) {

  if (fecha < obtenerFechaActual()) {

    throw new ErrorValidacion({
      fecha: 'La fecha de la cita no puede ser anterior a la actual'
    });

  }

}

function obtenerFechaActual() {

  const fecha = new Date();

  const anio = fecha.getFullYear();

  const mes = String(fecha.getMonth() + 1)
    .padStart(2, '0');

  const dia = String(fecha.getDate())
    .padStart(2, '0');

  return `${anio}-${mes}-${dia}`;

}

// Controlar conflictos generados por los índices únicos
// de SQLite, incluso después de validar disponibilidad.
function guardarConControlConflicto(operacion) {

  try {

    return operacion();

  } catch (error) {

    if (
      error.code === 'ERR_SQLITE_ERROR' &&
      error.message.includes('UNIQUE constraint failed')
    ) {

      throw new ErrorConflicto(
        'El horario seleccionado ya no se encuentra disponible'
      );

    }

    throw error;

  }

}

//#endregion