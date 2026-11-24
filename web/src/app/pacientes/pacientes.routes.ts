// Rutas del módulo Pacientes.
import { Routes } from '@angular/router';
import { PacientesLista } from './lista/pacientes-lista';

export const PACIENTES_ROUTES: Routes = [
  { path: '', component: PacientesLista },
  // TODO: nuevo ('nuevo') y edición (':id/editar') con el formulario
];