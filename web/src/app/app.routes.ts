// Rutas principales: cada módulo carga sus propias rutas de forma diferida.
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'pacientes', pathMatch: 'full' },
  {
    path: 'pacientes',
    title: 'Pacientes | MediAgenda',
    loadChildren: () => import('./pacientes/pacientes.routes').then((m) => m.PACIENTES_ROUTES),
  },
  {
    path: 'medicos',
    title: 'Médicos | MediAgenda',
    loadChildren: () => import('./medicos/medicos.routes').then((m) => m.MEDICOS_ROUTES),
  },
  {
    path: 'citas',
    title: 'Citas | MediAgenda',
    loadChildren: () => import('./citas/citas.routes').then((m) => m.CITAS_ROUTES),
  },
  { path: '**', redirectTo: 'pacientes' },
];