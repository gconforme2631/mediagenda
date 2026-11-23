// Repositorio de médicos: consultas SQL sobre la tabla medicos.
import { getDb } from '../config/database.js';

const COLUMNAS = 'id, nombres, apellidos, especialidad, telefono, correo';

export function listar() {
  return getDb()
    .prepare(`SELECT ${COLUMNAS} FROM medicos ORDER BY apellidos, nombres`)
    .all();
}

export function buscarPorId(id) {
  return getDb()
    .prepare(`SELECT ${COLUMNAS} FROM medicos WHERE id = ?`)
    .get(id);
}

export function buscarPorCorreo(correo) {
  return getDb()
    .prepare(`SELECT ${COLUMNAS} FROM medicos WHERE correo = ?`)
    .get(correo);
}

export function crear(medico) {
  return getDb()
    .prepare(
      `INSERT INTO medicos (nombres, apellidos, especialidad, telefono, correo)
       VALUES (:nombres, :apellidos, :especialidad, :telefono, :correo)
       RETURNING ${COLUMNAS}`,
    )
    .get(medico);
}

export function actualizar(id, medico) {
  return getDb()
    .prepare(
      `UPDATE medicos
       SET nombres = :nombres, apellidos = :apellidos, especialidad = :especialidad,
           telefono = :telefono, correo = :correo
       WHERE id = :id
       RETURNING ${COLUMNAS}`,
    )
    .get({ ...medico, id });
}

export function eliminar(id) {
  return (
    getDb().prepare('DELETE FROM medicos WHERE id = ?').run(id).changes > 0
  );
}

export function tieneCitas(id) {
  return (
    getDb()
      .prepare(
        'SELECT EXISTS (SELECT 1 FROM citas WHERE medico_id = ?) AS tiene',
      )
      .get(id).tiene === 1
  );
}
