// Repositorio de pacientes: consultas SQL sobre la tabla pacientes.
import { getDb } from '../config/database.js';

const COLUMNAS = 'id, cedula, nombres, apellidos, fecha_nacimiento, telefono, correo';

// SQLite ordena por bytes ('Álava' quedaría después de 'Muñoz'); se ordena en español
const ORDEN_ES = new Intl.Collator('es', { sensitivity: 'base' });

export function listar() {
  return getDb()
    .prepare(`SELECT ${COLUMNAS} FROM pacientes`)
    .all()
    .sort((a, b) => ORDEN_ES.compare(a.apellidos, b.apellidos) || ORDEN_ES.compare(a.nombres, b.nombres));
}

export function buscarPorId(id) {
  return getDb()
    .prepare(`SELECT ${COLUMNAS} FROM pacientes WHERE id = ?`)
    .get(id);
}

export function buscarPorCedula(cedula) {
  return getDb()
    .prepare(`SELECT ${COLUMNAS} FROM pacientes WHERE cedula = ?`)
    .get(cedula);
}

export function crear(paciente) {
  return getDb()
    .prepare(
      `INSERT INTO pacientes (cedula, nombres, apellidos, fecha_nacimiento, telefono, correo)
       VALUES (:cedula, :nombres, :apellidos, :fecha_nacimiento, :telefono, :correo)
       RETURNING ${COLUMNAS}`,
    )
    .get(paciente);
}

export function actualizar(id, paciente) {
  return getDb()
    .prepare(
      `UPDATE pacientes
       SET cedula = :cedula, nombres = :nombres, apellidos = :apellidos,
           fecha_nacimiento = :fecha_nacimiento, telefono = :telefono, correo = :correo
       WHERE id = :id
       RETURNING ${COLUMNAS}`,
    )
    .get({ ...paciente, id });
}

export function eliminar(id) {
  return getDb().prepare('DELETE FROM pacientes WHERE id = ?').run(id).changes > 0;
}

export function tieneCitas(id) {
  return (
    getDb()
      .prepare('SELECT EXISTS (SELECT 1 FROM citas WHERE paciente_id = ?) AS tiene')
      .get(id).tiene === 1
  );
}