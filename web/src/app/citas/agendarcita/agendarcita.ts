import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
  computed
} from '@angular/core';

import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';


import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import {
  finalize,
  forkJoin,
  switchMap,
  catchError,
  Subject,
  EMPTY
} from 'rxjs';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

import {
  Citas,
  Cita,
  HorarioDisponible
} from '../services/cita';


//#region INTERFACES

interface Paciente {

  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;

}

interface Medico {

  id: number;
  nombres: string;
  apellidos: string;
  especialidad: string;

}

interface ConsultaDisponibilidad {

  pacienteId: number;
  medicoId: number;
  fecha: string;

}

//#endregion


@Component({
  selector: 'app-agendarcita',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './agendarcita.html',
  styleUrl: './agendarcita.css'
})
export class Agendarcita implements OnInit {

  //#region INYECCIONES

  private readonly router = inject(Router);

  private readonly fb = inject(FormBuilder);

  private readonly http = inject(HttpClient);

  private readonly citasService = inject(Citas);

  private readonly destroyRef = inject(DestroyRef);

  //#endregion


  //#region CONFIGURACION

  private readonly apiUrl = `${environment.apiUrl}`;
  private readonly consultaDisponibilidad$ = new Subject<ConsultaDisponibilidad | null>();

  //#endregion


  //#region VARIABLES

  readonly pacientes = signal<Paciente[]>([]);

  readonly medicos = signal<Medico[]>([]);

  readonly horarios = signal<HorarioDisponible[]>([]);

  readonly horarioSeleccionado = signal('');

  readonly cargandoCatalogos = signal(false);

  readonly cargandoHorarios = signal(false);

  readonly guardando = signal(false);

  readonly disponibilidadConsultada = signal(false);

  readonly fechaMinima = this.obtenerFechaActual();


  readonly totalDisponibles = computed(() =>
    this.horarios()
      .filter(h => h.disponible)
      .length
  );


  readonly totalOcupados = computed(() =>
    this.horarios()
      .filter(h => h.ocupado && !h.transcurrido)
      .length
  );


  readonly totalTranscurridos = computed(() =>
    this.horarios()
      .filter(h => h.transcurrido)
      .length
  );

  //#endregion


  //#region FORMULARIO

  readonly formulario = this.fb.group({

    paciente_id: this.fb.control<number | null>(
      null,
      [
        Validators.required,
        Validators.min(1)
      ]
    ),

    medico_id: this.fb.control<number | null>(
      null,
      [
        Validators.required,
        Validators.min(1)
      ]
    ),

    fecha: this.fb.nonNullable.control(
      this.fechaMinima,
      [
        Validators.required,
        Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)
      ]
    ),

    hora: this.fb.nonNullable.control(
      '',
      Validators.required
    ),

    motivo: this.fb.nonNullable.control(
      '',
      [
        Validators.required,
        Validators.pattern(/\S/)
      ]
    )

  });

  //#endregion


  //#region CICLO DE VIDA

  ngOnInit(): void {

    this.inicializarDisponibilidad();

    this.cargarCatalogos();

  }

  //#endregion


  //#region CATALOGOS

  cargarCatalogos(): void {

    if (this.cargandoCatalogos()) {
      return;
    }

    this.cargandoCatalogos.set(true);

    forkJoin({

      pacientes: this.http.get<Paciente[]>(
        `${this.apiUrl}/pacientes`
      ),

      medicos: this.http.get<Medico[]>(
        `${this.apiUrl}/medicos`
      )

    })
      .pipe(

        takeUntilDestroyed(this.destroyRef),

        finalize(() => {

          this.cargandoCatalogos.set(false);

        })

      )
      .subscribe({

        next: ({ pacientes, medicos }) => {

          this.pacientes.set(pacientes);

          this.medicos.set(medicos);

        },

        error: (error: HttpErrorResponse) => {

          this.mostrarError(

            'Error al cargar información',

            this.obtenerMensajeError(
              error,
              'No fue posible cargar los pacientes y médicos.'
            )

          );

        }

      });

  }

  //#endregion


  //#region DISPONIBILIDAD

  private inicializarDisponibilidad(): void {

    this.consultaDisponibilidad$
      .pipe(

        switchMap(consulta => {

          // Cancela cualquier consulta anterior
          // cuando cambian los parámetros.

          if (!consulta) {

            this.cargandoHorarios.set(false);

            return EMPTY;

          }

          this.cargandoHorarios.set(true);

          return this.citasService
            .obtenerHorariosDisponibles(

              consulta.medicoId,

              consulta.pacienteId,

              consulta.fecha

            )
            .pipe(

              catchError((error: HttpErrorResponse) => {

                this.horarios.set([]);

                this.disponibilidadConsultada.set(false);

                this.mostrarError(

                  'Error de disponibilidad',

                  this.obtenerMensajeError(
                    error,
                    'No fue posible consultar los horarios disponibles.'
                  )

                );

                return EMPTY;

              }),

              finalize(() => {

                this.cargandoHorarios.set(false);

              })

            );

        }),

        takeUntilDestroyed(this.destroyRef)

      )
      .subscribe(respuesta => {

        this.horarios.set(

          [...respuesta].sort(
            (a, b) => a.hora.localeCompare(b.hora)
          )

        );

        this.disponibilidadConsultada.set(true);

      });

  }


  consultarDisponibilidad(): void {

    this.horarios.set([]);

    this.horarioSeleccionado.set('');

    this.disponibilidadConsultada.set(false);

    this.formulario.controls.hora.reset(
      '',
      { emitEvent: false }
    );

    const {
      paciente_id,
      medico_id,
      fecha
    } = this.formulario.getRawValue();


    // Validar los parámetros de consulta.

    if (
      !paciente_id ||
      !medico_id ||
      !fecha ||
      this.formulario.controls.paciente_id.invalid ||
      this.formulario.controls.medico_id.invalid ||
      this.formulario.controls.fecha.invalid ||
      fecha < this.obtenerFechaActual()
    ) {

      this.consultaDisponibilidad$.next(null);

      return;

    }


    // Consultar los horarios disponibles.

    this.consultaDisponibilidad$.next({

      pacienteId: paciente_id,

      medicoId: medico_id,

      fecha: fecha

    });

  }


  seleccionarHorario(
    horario: HorarioDisponible
  ): void {

    if (
      !horario.disponible ||
      horario.transcurrido ||
      horario.ocupado ||
      this.guardando() ||
      this.cargandoHorarios()
    ) {
      return;
    }

    this.horarioSeleccionado.set(
      horario.hora
    );

    this.formulario.controls.hora.setValue(
      horario.hora
    );

    this.formulario.controls.hora.markAsTouched();

  }

  //#endregion


  //#region GUARDAR

  guardarCita(): void {

    if (this.guardando()) {
      return;
    }

    this.formulario.markAllAsTouched();


    // Validar formulario.

    if (this.formulario.invalid) {

      this.mostrarAdvertencia(

        'Campos obligatorios',

        'Complete correctamente los campos obligatorios.'

      );

      return;

    }


    const valores = this.formulario.getRawValue();


    // Validar paciente y médico.

    if (
      valores.paciente_id === null ||
      valores.medico_id === null
    ) {

      this.mostrarAdvertencia(

        'Información incompleta',

        'Seleccione el paciente y el médico.'

      );

      return;

    }


    // Validar fecha de atención.

    if (valores.fecha < this.obtenerFechaActual()) {

      this.mostrarAdvertencia(

        'Fecha no válida',

        'La fecha de atención no puede ser anterior a la actual.'

      );

      return;

    }


    // Validar consulta de disponibilidad.

    if (this.cargandoHorarios()) {

      this.mostrarAdvertencia(

        'Consultando disponibilidad',

        'Espere mientras se consultan los horarios disponibles.'

      );

      return;

    }


    // Validar horario seleccionado.

    const horarioValido = this.horarios().some(

      horario =>

        horario.hora === valores.hora &&

        horario.disponible &&

        !horario.transcurrido &&

        !horario.ocupado

    );


    if (
      !this.disponibilidadConsultada() ||
      !horarioValido
    ) {

      this.mostrarAdvertencia(

        'Horario no disponible',

        'Seleccione un horario disponible para agendar la cita.'

      );

      return;

    }


    // Construir objeto de registro.

    const cita: Cita = {

      paciente_id: valores.paciente_id,

      medico_id: valores.medico_id,

      fecha: valores.fecha,

      hora: valores.hora,

      motivo: valores.motivo.trim(),

      estado: 'programada'

    };


    // Bloquear formulario durante el registro.

    this.guardando.set(true);

    this.formulario.disable({
      emitEvent: false
    });


    // Registrar cita médica.

    this.citasService
      .crearCita(cita)
      .pipe(

        takeUntilDestroyed(this.destroyRef),

        finalize(() => {

          this.guardando.set(false);

          this.formulario.enable({
            emitEvent: false
          });

        })

      )
      .subscribe({

        next: async () => {

          // Mostrar confirmación de registro.

          await this.mostrarExito(

            'Cita agendada',

            'La cita médica se agendó correctamente.'

          );


          // Verificar que el componente siga activo.

          if (this.destroyRef.destroyed) {
            return;
          }


          // Regresar a la gestión de citas.

          this.regresar();

        },


        error: async (error: HttpErrorResponse) => {

          const mensaje = this.obtenerMensajeError(

            error,

            'No fue posible registrar la cita médica.'

          );


          // Conflicto de disponibilidad o
          // horario que ya ha transcurrido.

          if (
            error.status === 409 ||
            error.error?.errores?.hora
          ) {

            // Invalidar inmediatamente el horario.

            this.horarioSeleccionado.set('');

            this.disponibilidadConsultada.set(false);

            this.formulario.controls.hora.reset(
              '',
              { emitEvent: false }
            );


            await this.mostrarAdvertencia(

              'Horario no disponible',

              mensaje

            );


            if (this.destroyRef.destroyed) {
              return;
            }


            // Actualizar disponibilidad.

            this.consultarDisponibilidad();

            return;

          }


          // Error general de registro.

          this.mostrarError(

            'Error al agendar cita',

            mensaje

          );

        }

      });

  }

  //#endregion


  //#region NAVEGACION

  regresar(): void {

    if (this.guardando()) {
      return;
    }

    this.router.navigate([
      '/citas/gestioncitas'
    ]);

  }

  //#endregion


  //#region NOTIFICACIONES

  private async mostrarExito(

    titulo: string,

    mensaje: string

  ): Promise<void> {

    await Swal.fire({

      icon: 'success',

      title: titulo,

      text: mensaje,

      confirmButtonText: 'Aceptar',

      confirmButtonColor: '#176b58',

      allowOutsideClick: false,

      allowEscapeKey: false,

      heightAuto: false

    });

  }


  private async mostrarAdvertencia(

    titulo: string,

    mensaje: string

  ): Promise<void> {

    await Swal.fire({

      icon: 'warning',

      title: titulo,

      text: mensaje,

      confirmButtonText: 'Aceptar',

      confirmButtonColor: '#176b58',

      allowOutsideClick: false,

      heightAuto: false

    });

  }


  private async mostrarError(

    titulo: string,

    mensaje: string

  ): Promise<void> {

    await Swal.fire({

      icon: 'error',

      title: titulo,

      text: mensaje,

      confirmButtonText: 'Aceptar',

      confirmButtonColor: '#176b58',

      allowOutsideClick: false,

      heightAuto: false

    });

  }

  //#endregion


  //#region VALIDACIONES

  campoInvalido(
    campo: keyof typeof this.formulario.controls
  ): boolean {

    const control =
      this.formulario.controls[campo];

    return control.invalid &&
      (control.touched || control.dirty);

  }

  //#endregion


  //#region UTILIDADES

  limpiarFormulario(): void {

    if (this.guardando()) {
      return;
    }


    // Cancelar consultas pendientes.

    this.consultaDisponibilidad$.next(null);


    // Restablecer formulario.

    this.formulario.reset({

      paciente_id: null,

      medico_id: null,

      fecha: this.obtenerFechaActual(),

      hora: '',

      motivo: ''

    }, {

      emitEvent: false

    });


    // Restablecer variables.

    this.horarios.set([]);

    this.horarioSeleccionado.set('');

    this.disponibilidadConsultada.set(false);

    this.cargandoHorarios.set(false);

  }


  private obtenerFechaActual(): string {

    const fecha = new Date();

    const anio = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;

  }


  private obtenerMensajeError(

    error: HttpErrorResponse,

    mensajePredeterminado: string

  ): string {

    const errores = error.error?.errores;


    // Priorizar errores específicos de validación.

    if (
      errores &&
      typeof errores === 'object'
    ) {

      const mensajes = Object.values(errores)
        .filter(
          (mensaje): mensaje is string =>
            typeof mensaje === 'string' &&
            mensaje.trim().length > 0
        );

      if (mensajes.length > 0) {

        return mensajes.join('\n');

      }

    }


    // Obtener mensaje general del backend.

    if (
      typeof error.error?.mensaje === 'string' &&
      error.error.mensaje.trim().length > 0
    ) {

      return error.error.mensaje;

    }


    // Mensaje de conexión.

    if (error.status === 0) {

      return 'No fue posible establecer conexión con el servidor.';

    }


    return mensajePredeterminado;

  }

  //#endregion

}
