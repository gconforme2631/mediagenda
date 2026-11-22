// Estado de conexión con la API, verificado contra /api/salud.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EstadoApiService {
  private readonly http = inject(HttpClient);

  readonly disponible = signal(true); // optimista hasta la primera verificación
  readonly verificando = signal(false);

  verificar(): void {
    this.verificando.set(true);
    this.http
      .get(`${environment.apiUrl}/salud`)
      .pipe(finalize(() => this.verificando.set(false)))
      .subscribe({
        next: () => this.disponible.set(true),
        error: () => this.disponible.set(false),
      });
  }

  marcar(disponible: boolean): void {
    this.disponible.set(disponible);
  }
}