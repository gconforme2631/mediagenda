// Repositorio de citas: consultas SQL sobre la tabla citas.

import { getDb } from '../config/database.js';

const COLUMNAS = `
  id,
  paciente_id,
  medico_id,
  fecha,
  hora,
  motivo,
  estado
`;

const CONSULTA_DETALLE = `
  SELECT
    c.id,
    c.paciente_id,
    c.medico_id,
    c.fecha,
    c.hora,
    c.motivo,
    c.estado,

    p.nombres AS paciente_nombres,
    p.apellidos AS paciente_apellidos,
    p.cedula AS paciente_cedula,

    m.nombres AS medico_nombres,
    m.apellidos AS medico_apellidos,
    m.especialidad AS medico_especialidad

  FROM citas c

  INNER JOIN pacientes p
    ON p.id = c.paciente_id

  INNER JOIN medicos m
    ON m.id = c.medico_id
`;

// Listar citas con filtros opcionales.
export function listar(filtros = {}) {

  const condiciones = [];
  const parametros = [];

  if (filtros.paciente_id !== undefined) {
    condiciones.push('c.paciente_id = ?');
    parametros.push(filtros.paciente_id);
  }

  if (filtros.medico_id !== undefined) {
    condiciones.push('c.medico_id = ?');
    parametros.push(filtros.medico_id);
  }

  if (filtros.fecha !== undefined) {
    condiciones.push('c.fecha = ?');
    parametros.push(filtros.fecha);
  }

  if (filtros.estado !== undefined) {
    condiciones.push('c.estado = ?');
    parametros.push(filtros.estado);
  }

  const where = condiciones.length > 0
    ? `WHERE ${condiciones.join(' AND ')}`
    : '';

  return getDb()
    .prepare(`
      ${CONSULTA_DETALLE}
      ${where}
      ORDER BY c.fecha, c.hora, c.id
    `)
    .all(...parametros);

}

// Buscar una cita por su identificador.
export function buscarPorId(id) {

  return getDb()
    .prepare(`
      ${CONSULTA_DETALLE}
      WHERE c.id = ?
    `)
    .get(id);

}

// Registrar una nueva cita.
export function crear(cita) {

  return getDb()
    .prepare(`
      INSERT INTO citas (
        paciente_id,
        medico_id,
        fecha,
        hora,
        motivo,
        estado
      )
      VALUES (
        :paciente_id,
        :medico_id,
        :fecha,
        :hora,
        :motivo,
        :estado
      )
      RETURNING ${COLUMNAS}
    `)
    .get(cita);

}

// Actualizar una cita existente.
export function actualizar(id, cita) {

  return getDb()
    .prepare(`
      UPDATE citas
      SET
        paciente_id = :paciente_id,
        medico_id = :medico_id,
        fecha = :fecha,
        hora = :hora,
        motivo = :motivo,
        estado = :estado
      WHERE id = :id
      RETURNING ${COLUMNAS}
    `)
    .get({ ...cita, id });

}

// Actualizar únicamente el estado.
export function cambiarEstado(id, estado) {

  return getDb()
    .prepare(`
      UPDATE citas
      SET estado = ?
      WHERE id = ?
      RETURNING ${COLUMNAS}
    `)
    .get(estado, id);

}

// Verificar si existe el paciente.
export function existePaciente(id) {

  return getDb()
    .prepare(`
      SELECT EXISTS (
        SELECT 1
        FROM pacientes
        WHERE id = ?
      ) AS existe
    `)
    .get(id).existe === 1;

}

// Verificar si existe el médico.
export function existeMedico(id) {

  return getDb()
    .prepare(`
      SELECT EXISTS (
        SELECT 1
        FROM medicos
        WHERE id = ?
      ) AS existe
    `)
    .get(id).existe === 1;

}

// Verificar si el médico tiene ocupado el horario.
export function medicoTieneCita(
  medicoId,
  fecha,
  hora,
  idActual = null
) {

  return getDb()
    .prepare(`
      SELECT EXISTS (
        SELECT 1
        FROM citas
        WHERE medico_id = ?
          AND fecha = ?
          AND hora = ?
          AND estado <> 'cancelada'
          AND (? IS NULL OR id <> ?)
      ) AS existe
    `)
    .get(
      medicoId,
      fecha,
      hora,
      idActual,
      idActual
    ).existe === 1;

}

// Verificar si el paciente tiene ocupado el horario.
export function pacienteTieneCita(
  pacienteId,
  fecha,
  hora,
  idActual = null
) {

  return getDb()
    .prepare(`
      SELECT EXISTS (
        SELECT 1
        FROM citas
        WHERE paciente_id = ?
          AND fecha = ?
          AND hora = ?
          AND estado <> 'cancelada'
          AND (? IS NULL OR id <> ?)
      ) AS existe
    `)
    .get(
      pacienteId,
      fecha,
      hora,
      idActual,
      idActual
    ).existe === 1;

}

// Obtener horarios ocupados por el médico o paciente.
export function obtenerHorariosOcupados(
  medicoId,
  pacienteId,
  fecha
) {

  return getDb()
    .prepare(`
      SELECT DISTINCT hora
      FROM citas
      WHERE fecha = ?
        AND estado <> 'cancelada'
        AND (
          medico_id = ?
          OR paciente_id = ?
        )
      ORDER BY hora
    `)
    .all(fecha, medicoId, pacienteId)
    .map(cita => cita.hora);

}