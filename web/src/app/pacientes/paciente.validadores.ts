// Validadores del formulario de pacientes: mismas reglas que la API.
import { AbstractControl, ValidationErrors } from '@angular/forms';

// Provincia 01-24 o 30, tercer dígito menor a 6 y dígito verificador (módulo 10)
export function esCedulaValida(cedula: string): boolean {
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

  return (10 - (suma % 10)) % 10 === Number(cedula[9]);
}

export function hoyISO(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

// Vacío lo resuelve Validators.required
export function cedulaValida(control: AbstractControl<string>): ValidationErrors | null {
  const valor = control.value?.trim();
  if (!valor) return null;
  return esCedulaValida(valor) ? null : { cedula: true };
}

export function fechaNoFutura(control: AbstractControl<string>): ValidationErrors | null {
  const valor = control.value;
  if (!valor) return null;
  return valor > hoyISO() ? { futura: true } : null;
}