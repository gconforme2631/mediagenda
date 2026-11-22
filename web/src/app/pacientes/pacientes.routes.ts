// Rutas del módulo Pacientes.
import { Routes } from '@angular/router';
import { EnConstruccion } from '../shared/en-construccion/en-construccion';

export const PACIENTES_ROUTES: Routes = [
  // TODO: lista (''), nuevo ('nuevo') y edición (':id/editar')
  { path: '', component: EnConstruccion, data: { titulo: 'Pacientes' } },
];