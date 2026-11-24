// Rutas del módulo Pacientes.
import { Routes } from '@angular/router';
import { PacientesLista } from './lista/pacientes-lista';
import { PacienteFormulario } from './formulario/paciente-formulario';

export const PACIENTES_ROUTES: Routes = [
  { path: '', component: PacientesLista },
  { path: 'nuevo', component: PacienteFormulario },
  { path: ':id/editar', component: PacienteFormulario },
];