// Servicio de médicos: reglas de negocio sobre el repositorio.
import * as medicosRepository from '../repositories/medicos.repository.js';
import { validarMedico } from '../validations/medicos.validation.js';
import { ErrorConflicto, ErrorNoEncontrado } from '../utils/errores.js';

const NO_ENCONTRADO = 'Médico no encontrado';

export function listar() {
  return medicosRepository.listar();
}

export function obtener(id) {
  const medico = medicosRepository.buscarPorId(id);
  if (!medico) throw new ErrorNoEncontrado(NO_ENCONTRADO);
  return medico;
}

export function crear(datos) {
  const medico = validarMedico(datos);
  verificarCorreoDisponible(medico.correo);
  return medicosRepository.crear(medico);
}

export function actualizar(id, datos) {
  obtener(id);
  const medico = validarMedico(datos);
  verificarCorreoDisponible(medico.correo, id);
  return medicosRepository.actualizar(id, medico);
}

export function eliminar(id) {
  if (medicosRepository.tieneCitas(id)) {
    throw new ErrorConflicto(
      'No se puede eliminar un médico con citas registradas',
    );
  }
  if (!medicosRepository.eliminar(id))
    throw new ErrorNoEncontrado(NO_ENCONTRADO);
}

function verificarCorreoDisponible(correo, idActual) {
  const existente = medicosRepository.buscarPorCorreo(correo);
  if (existente && existente.id !== idActual) {
    throw new ErrorConflicto('Ya existe un médico con ese correo');
  }
}
