// Mensaje visible cuando la API no responde, con opción de reintentar.
import { Component, OnInit, inject } from '@angular/core';
import { EstadoApiService } from './estado-api.service';

@Component({
  selector: 'app-api-caida',
  template: `
    @if (!estadoApi.disponible()) {
      <div class="api-caida" role="alert">
        <span>No se puede conectar con el servidor. Verifica que la API esté en ejecución.</span>
        <button
          type="button"
          class="btn btn--secundario btn--pequeno"
          [disabled]="estadoApi.verificando()"
          (click)="estadoApi.verificar()"
        >
          {{ estadoApi.verificando() ? 'Verificando…' : 'Reintentar' }}
        </button>
      </div>
    }
  `,
  styleUrl: './api-caida.css',
})
export class ApiCaida implements OnInit {
  protected readonly estadoApi = inject(EstadoApiService);

  ngOnInit(): void {
    this.estadoApi.verificar();
  }
}