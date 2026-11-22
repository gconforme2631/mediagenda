// Muestra el aviso activo del AvisoService.
import { Component, inject } from '@angular/core';
import { AvisoService } from './aviso.service';

@Component({
  selector: 'app-avisos',
  template: `
    @if (avisos.actual(); as aviso) {
      <div
        class="aviso"
        [class.aviso--error]="aviso.tipo === 'error'"
        [attr.role]="aviso.tipo === 'error' ? 'alert' : 'status'"
      >
        <span>{{ aviso.mensaje }}</span>
        <button type="button" class="aviso__cerrar" (click)="avisos.cerrar()" aria-label="Cerrar aviso">×</button>
      </div>
    }
  `,
  styleUrl: './avisos.css',
})
export class Avisos {
  protected readonly avisos = inject(AvisoService);
}