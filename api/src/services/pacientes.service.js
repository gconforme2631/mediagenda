// Servicio de pacientes: reglas de negocio sobre el repositorio.
import * as pacientesRepository from '../repositories/pacientes.repository.js';
import { validarPaciente } from '../validations/pacientes.validation.js';
import { ErrorConflicto, ErrorNoEncontrado } from '../utils/errores.js';

const NO_ENCONTRADO = 'Paciente no encontrado';

export function listar() {
  return pacientesRepository.listar();
}

export function obtener(id) {
  const paciente = pacientesRepository.buscarPorId(id);
  if (!paciente) throw new ErrorNoEncontrado(NO_ENCONTRADO);
  return paciente;
}

export function crear(datos) {
  const paciente = validarPaciente(datos);
  verificarCedulaDisponible(paciente.cedula);
  return pacientesRepository.crear(paciente);
}

export function actualizar(id, datos) {
  obtener(id);
  const paciente = validarPaciente(datos);
  verificarCedulaDisponible(paciente.cedula, id);
  return pacientesRepository.actualizar(id, paciente);
}

export function eliminar(id) {
  if (pacientesRepository.tieneCitas(id)) {
    throw new ErrorConflicto('No se puede eliminar un paciente con citas registradas');
  }
  if (!pacientesRepository.eliminar(id)) throw new ErrorNoEncontrado(NO_ENCONTRADO);
}

// idActual permite conservar la propia cédula al editar
function verificarCedulaDisponible(cedula, idActual) {
  const existente = pacientesRepository.buscarPorCedula(cedula);
  if (existente && existente.id !== idActual) {
    throw new ErrorConflicto('Ya existe un paciente con esa cédula');
  }
}