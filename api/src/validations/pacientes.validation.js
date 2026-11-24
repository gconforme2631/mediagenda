// Validaciones del módulo Pacientes: cédula ecuatoriana y datos del formulario.
import { ErrorValidacion } from '../utils/errores.js';

const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const CELULAR = /^09\d{8}$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

const CAMPOS_OBLIGATORIOS = ['cedula', 'nombres', 'apellidos', 'fecha_nacimiento', 'telefono', 'correo'];

// Provincia 01-24 o 30, tercer dígito menor a 6 y dígito verificador (módulo 10)
export function validarCedula(cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = Number(cedula.slice(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false;
  if (Number(cedula[2]) >= 6) return false;

  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = Number(cedula[i]) * (i % 2 === 0 ? 2 : 1);
    if (valor > 9) valor -= 9;
    suma += valor;
  }

  const verificador = (10 - (suma % 10)) % 10;
  return verificador === Number(cedula[9]);
}

function esFechaValida(fecha) {
  if (!FECHA_ISO.test(fecha)) return false;

  const [anio, mes, dia] = fecha.split('-').map(Number);
  const d = new Date(Date.UTC(anio, mes - 1, dia));

  // descarta fechas inexistentes como 2025-02-30
  return d.getUTCFullYear() === anio && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

function hoyISO() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`; // fecha local del servidor
}

function texto(valor) {
  return valor == null ? '' : String(valor).trim();
}

// Normaliza los datos y lanza ErrorValidacion con todos los errores encontrados
export function validarPaciente(datos = {}) {
  const paciente = {
    cedula: texto(datos.cedula),
    nombres: texto(datos.nombres).replace(/\s+/g, ' '),
    apellidos: texto(datos.apellidos).replace(/\s+/g, ' '),
    fecha_nacimiento: texto(datos.fecha_nacimiento),
    telefono: texto(datos.telefono),
    correo: texto(datos.correo).toLowerCase(),
  };

  const errores = {};

  // Obligatorios
  for (const campo of CAMPOS_OBLIGATORIOS) {
    if (!paciente[campo]) errores[campo] = 'Este campo es obligatorio';
  }

  // Formatos
  if (!errores.cedula && !validarCedula(paciente.cedula)) {
    errores.cedula = 'La cédula no es válida';
  }

  if (!errores.nombres && !SOLO_LETRAS.test(paciente.nombres)) {
    errores.nombres = 'Solo se permiten letras';
  }

  if (!errores.apellidos && !SOLO_LETRAS.test(paciente.apellidos)) {
    errores.apellidos = 'Solo se permiten letras';
  }

  if (!errores.fecha_nacimiento) {
    if (!esFechaValida(paciente.fecha_nacimiento)) {
      errores.fecha_nacimiento = 'La fecha no es válida';
    } else if (paciente.fecha_nacimiento > hoyISO()) {
      errores.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura';
    }
  }

  if (!errores.telefono && !CELULAR.test(paciente.telefono)) {
    errores.telefono = 'El celular debe tener el formato 09XXXXXXXX';
  }

  if (!errores.correo && !CORREO.test(paciente.correo)) {
    errores.correo = 'El correo no es válido';
  }

  if (Object.keys(errores).length > 0) throw new ErrorValidacion(errores);

  return paciente;
}