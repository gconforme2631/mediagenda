// Validaciones del módulo Médicos: datos del formulario.
import { ErrorValidacion } from '../utils/errores.js';

const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const CELULAR = /^09\d{8}$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const CAMPOS_OBLIGATORIOS = [
  'nombres',
  'apellidos',
  'especialidad',
  'telefono',
  'correo',
];
const CAMPOS_DE_LETRAS = ['nombres', 'apellidos', 'especialidad'];

function texto(valor) {
  return typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : '';
}

function normalizar(datos) {
  return {
    nombres: texto(datos.nombres),
    apellidos: texto(datos.apellidos),
    especialidad: texto(datos.especialidad),
    telefono: texto(datos.telefono),
    correo: texto(datos.correo).toLowerCase(),
  };
}

function buscarErrores(medico) {
  const errores = {};

  for (const campo of CAMPOS_OBLIGATORIOS) {
    if (!medico[campo]) errores[campo] = 'Este campo es obligatorio';
  }

  for (const campo of CAMPOS_DE_LETRAS) {
    if (!errores[campo] && !SOLO_LETRAS.test(medico[campo]))
      errores[campo] = 'Solo se permiten letras';
  }

  if (!errores.telefono && !CELULAR.test(medico.telefono)) {
    errores.telefono = 'El celular debe tener el formato 09XXXXXXXX';
  }

  if (!errores.correo && !CORREO.test(medico.correo)) {
    errores.correo = 'El correo no es válido';
  }

  return errores;
}

export function validarMedico(datos = {}) {
  const medico = normalizar(datos);
  const errores = buscarErrores(medico);

  if (Object.keys(errores).length > 0) throw new ErrorValidacion(errores);

  return medico;
}
