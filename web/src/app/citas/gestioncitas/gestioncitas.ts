import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
  computed
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import {
  Subject,
  EMPTY,
  switchMap,
  catchError,
  finalize
} from 'rxjs';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import Swal from 'sweetalert2';

import {
  Citas,
  CitaDetalle,
  EstadoCita
} from '../services/cita';

@Component({
  selector: 'app-gestioncitas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './gestioncitas.html',
  styleUrl: './gestioncitas.css'
})
export class Gestioncitas implements OnInit {

  //#region INYECCIONES

  private readonly citasService = inject(Citas);

  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);

  //#endregion

  //#region VARIABLES

  readonly citas = signal<CitaDetalle[]>([]);

  readonly cargando = signal(false);

  readonly procesando = signal(false);

  readonly citaProcesandoId =
    signal<number | null>(null);

  readonly mensajeError = signal('');

  private readonly consultaFecha$ =
    new Subject<string>();

  //#endregion

  //#region FILTROS

  readonly filtroFecha = signal(
    this.obtenerFechaActual()
  );

  readonly filtroBusqueda = signal('');

  readonly filtroEstado =
    signal<EstadoCita | ''>('');

  //#endregion

  //#region INDICADORES

  readonly totalCitas = computed(() =>
    this.citas().length
  );

  readonly totalProgramadas = computed(() =>
    this.citas()
      .filter(cita => cita.estado === 'programada')
      .length
  );

  readonly totalAtendidas = computed(() =>
    this.citas()
      .filter(cita => cita.estado === 'atendida')
      .length
  );

  readonly totalCanceladas = computed(() =>
    this.citas()
      .filter(cita => cita.estado === 'cancelada')
      .length
  );

  //#endregion

  //#region FILTRADO

  readonly citasFiltradas = computed(() => {

    const busqueda = this.normalizarTexto(
      this.filtroBusqueda()
    );

    const estado = this.filtroEstado();

    return this.citas()
      .filter(cita => {

        const texto = this.normalizarTexto(
          `${cita.paciente_nombres}
           ${cita.paciente_apellidos}
           ${cita.paciente_cedula}
           ${cita.medico_nombres}
           ${cita.medico_apellidos}
           ${cita.medico_especialidad}`
        );

        const coincideBusqueda =
          !busqueda ||
          busqueda.split(/\s+/).every(
            palabra => texto.includes(palabra)
          );

        const coincideEstado =
          !estado || cita.estado === estado;

        return (
          coincideBusqueda &&
          coincideEstado
        );

      })
      .sort((a, b) =>
        a.hora.localeCompare(b.hora)
      );

  });

  //#endregion

  //#region CICLO DE VIDA

  ngOnInit(): void {

    this.inicializarConsulta();

    this.cargarCitas();

  }

  //#endregion

  //#region CONSULTAS

  private inicializarConsulta(): void {

    this.consultaFecha$
      .pipe(

        switchMap(fecha => {

          this.cargando.set(true);

          this.mensajeError.set('');

          this.citas.set([]);

          return this.citasService
            .obtenerCitasPorFecha(fecha)
            .pipe(

              catchError(
                (error: HttpErrorResponse) => {

                  this.mensajeError.set(
                    this.obtenerMensajeError(
                      error,
                      'No fue posible consultar las citas médicas.'
                    )
                  );

                  return EMPTY;

                }
              ),

              finalize(() => {

                this.cargando.set(false);

              })

            );

        }),

        takeUntilDestroyed(this.destroyRef)

      )
      .subscribe(respuesta => {

        this.citas.set(respuesta);

      });

  }

  cargarCitas(): void {

    const fecha = this.filtroFecha();

    if (!fecha) {
      return;
    }

    this.consultaFecha$.next(fecha);

  }

  cambiarFecha(fecha: string): void {

    if (!fecha) {

      this.filtroFecha.set(
        this.obtenerFechaActual()
      );

    } else {

      this.filtroFecha.set(fecha);

    }

    this.cargarCitas();

  }

  consultarHoy(): void {

    this.cambiarFecha(
      this.obtenerFechaActual()
    );

  }

  cambiarDia(dias: number): void {

    const [anio, mes, dia] =
      this.filtroFecha()
        .split('-')
        .map(Number);

    const fecha = new Date(
      anio,
      mes - 1,
      dia
    );

    fecha.setDate(
      fecha.getDate() + dias
    );

    this.cambiarFecha(
      this.formatearFechaISO(fecha)
    );

  }

  //#endregion

  //#region NAVEGACION

  nuevaCita(): void {

    if (this.procesando()) {
      return;
    }

    this.router.navigate([
      '/citas/agendarcita'
    ]);

  }

  //#endregion

  //#region CANCELACION DE CITAS

  async confirmarCancelacion(
    cita: CitaDetalle
  ): Promise<void> {

    if (
      cita.id == null ||
      cita.estado !== 'programada' ||
      this.procesando() ||
      this.cargando()
    ) {
      return;
    }

    const id = cita.id;

    this.procesando.set(true);

    this.citaProcesandoId.set(id);

    const paciente =
      `${cita.paciente_nombres} ${cita.paciente_apellidos}`;

    const medico =
      `${cita.medico_nombres} ${cita.medico_apellidos}`;

    const resultado = await Swal.fire({

      title: '¿Cancelar cita médica?',

      text:
        `Paciente: ${paciente}\n` +
        `Médico: ${medico}\n` +
        `Fecha: ${this.formatearFecha(cita.fecha)}\n` +
        `Hora: ${cita.hora}\n\n` +
        'Esta acción no podrá revertirse.',

      icon: 'warning',

      showCancelButton: true,

      confirmButtonText: 'Sí, cancelar cita',

      cancelButtonText: 'Regresar',

      confirmButtonColor: '#dc2626',

      cancelButtonColor: '#64748b',

      reverseButtons: true,

      focusCancel: true,

      allowOutsideClick: false,

      didOpen: () => {

        const contenido =
          Swal.getHtmlContainer();

        if (contenido) {

          contenido.style.whiteSpace =
            'pre-line';

        }

      }

    });

    if (
      !resultado.isConfirmed ||
      this.destroyRef.destroyed
    ) {

      this.procesando.set(false);

      this.citaProcesandoId.set(null);

      return;

    }

    this.cancelarCita(id);

  }

  private cancelarCita(id: number): void {

    this.citasService
      .cancelarCita(id)
      .pipe(

        takeUntilDestroyed(this.destroyRef),

        finalize(() => {

          this.procesando.set(false);

          this.citaProcesandoId.set(null);

        })

      )
      .subscribe({

        next: () => {

          // Actualizar el estado local.

          this.citas.update(citas =>
            citas.map(cita =>
              cita.id === id
                ? {
                    ...cita,
                    estado: 'cancelada'
                  }
                : cita
            )
          );

          // Consultar nuevamente el backend.

          this.cargarCitas();

          Swal.fire({

            title: 'Cita cancelada',

            text:
              'La cita médica se canceló correctamente.',

            icon: 'success',

            confirmButtonText: 'Aceptar',

            confirmButtonColor: '#176b58'

          });

        },

        error: (error: HttpErrorResponse) => {

          Swal.fire({

            title: 'No fue posible cancelar',

            text: this.obtenerMensajeError(
              error,
              'Ocurrió un error al cancelar la cita médica.'
            ),

            icon: 'error',

            confirmButtonText: 'Aceptar',

            confirmButtonColor: '#176b58'

          });

          this.cargarCitas();

        }

      });

  }

  //#endregion

  //#region FILTROS

  seleccionarEstado(
    estado: EstadoCita | ''
  ): void {

    this.filtroEstado.set(
      this.filtroEstado() === estado
        ? ''
        : estado
    );

  }

  limpiarFiltros(): void {

    this.filtroBusqueda.set('');

    this.filtroEstado.set('');

    this.consultarHoy();

  }

  //#endregion

  //#region UTILIDADES

  private obtenerFechaActual(): string {

    return this.formatearFechaISO(
      new Date()
    );

  }

  private formatearFechaISO(
    fecha: Date
  ): string {

    const anio = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;

  }

  formatearFecha(fecha: string): string {

    const [anio, mes, dia] =
      fecha.split('-');

    return `${dia}/${mes}/${anio}`;

  }

  esFechaActual(): boolean {

    return this.filtroFecha() ===
      this.obtenerFechaActual();

  }

  obtenerNombreEstado(
    estado: EstadoCita
  ): string {

    switch (estado) {

      case 'programada':
        return 'Programada';

      case 'atendida':
        return 'Atendida';

      case 'cancelada':
        return 'Cancelada';

    }

  }

  private normalizarTexto(
    valor: string
  ): string {

    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  }

  private obtenerMensajeError(
    error: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {

    return typeof error.error?.mensaje === 'string'
      ? error.error.mensaje
      : mensajePredeterminado;

  }

  //#endregion

}
