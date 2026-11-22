// Avisos breves de confirmación o error, visibles desde cualquier vista.
import { Injectable, signal } from '@angular/core';

export type TipoAviso = 'exito' | 'error';

export interface Aviso {
  mensaje: string;
  tipo: TipoAviso;
}

@Injectable({ providedIn: 'root' })
export class AvisoService {
  private readonly duracionMs = 3500;
  private temporizador?: ReturnType<typeof setTimeout>;

  readonly actual = signal<Aviso | null>(null);

  exito(mensaje: string): void {
    this.mostrar({ mensaje, tipo: 'exito' });
  }

  error(mensaje: string): void {
    this.mostrar({ mensaje, tipo: 'error' });
  }

  cerrar(): void {
    clearTimeout(this.temporizador);
    this.actual.set(null);
  }

  private mostrar(aviso: Aviso): void {
    clearTimeout(this.temporizador); // reinicia el tiempo si llega otro aviso
    this.actual.set(aviso);
    this.temporizador = setTimeout(() => this.actual.set(null), this.duracionMs);
  }
}