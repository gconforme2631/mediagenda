// Rutas del módulo Citas (integrante 3).
import { Routes } from '@angular/router';
import { EnConstruccion } from '../shared/en-construccion/en-construccion';

export const CITAS_ROUTES: Routes = [
  // TODO: lista (''), nuevo ('nuevo') y edición (':id/editar')
  { path: '', component: EnConstruccion, data: { titulo: 'Citas' } },
];