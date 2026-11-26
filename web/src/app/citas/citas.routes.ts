import { Routes } from '@angular/router';

export const citasRoutes: Routes = [

  {
    path: '',
    redirectTo: 'gestioncitas',
    pathMatch: 'full'
  },

  {
    path: 'gestioncitas',
    loadComponent: () =>
      import('./gestioncitas/gestioncitas')
        .then(m => m.Gestioncitas)
  },

  {
    path: 'agendarcita',
    loadComponent: () =>
      import('./agendarcita/agendarcita')
        .then(m => m.Agendarcita)
  }

];
