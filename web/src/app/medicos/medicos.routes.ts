// Rutas del módulo Médicos (integrante 2).
import { Routes } from '@angular/router';
import { MedicosLista } from './lista/medicos-lista';
import { MedicoFormulario } from './formulario/medico-formulario';

export const MEDICOS_ROUTES: Routes = [
  { path: '', component: MedicosLista },
  { path: 'nuevo', component: MedicoFormulario },
  { path: ':id/editar', component: MedicoFormulario },
];
