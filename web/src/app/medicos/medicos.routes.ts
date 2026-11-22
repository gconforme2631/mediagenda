// Rutas del módulo Médicos (integrante 2).
import { Routes } from '@angular/router';
import { EnConstruccion } from '../shared/en-construccion/en-construccion';

export const MEDICOS_ROUTES: Routes = [
  // TODO: lista (''), nuevo ('nuevo') y edición (':id/editar')
  { path: '', component: EnConstruccion, data: { titulo: 'Médicos' } },
];