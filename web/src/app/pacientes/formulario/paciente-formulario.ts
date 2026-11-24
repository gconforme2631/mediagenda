// Formulario de pacientes: registra uno nuevo o edita el indicado en la ruta.
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AvisoService } from '../../shared/aviso/aviso.service';
import { DatosPaciente } from '../paciente.model';
import { PacientesService } from '../pacientes.service';
import { cedulaValida, fechaNoFutura, hoyISO } from '../paciente.validadores';

const LETRAS = /^ *[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: +[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)* *$/;
const CELULAR = /^09\d{8}$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Campo {
  nombre: keyof DatosPaciente;
  etiqueta: string;
  tipo: string;
  autocompletar: string;
  formato: string; // mensaje para cualquier error distinto de "obligatorio"
  longitud?: number;
  teclado?: string;
}

const CAMPOS: Campo[] = [
  {
    nombre: 'cedula',
    etiqueta: 'Cédula',
    tipo: 'text',
    autocompletar: 'off',
    formato: 'La cédula no es válida',
    longitud: 10,
    teclado: 'numeric',
  },
  {
    nombre: 'fecha_nacimiento',
    etiqueta: 'Fecha de nacimiento',
    tipo: 'date',
    autocompletar: 'bday',
    formato: 'La fecha de nacimiento no puede ser futura',
  },
  {
    nombre: 'nombres',
    etiqueta: 'Nombres',
    tipo: 'text',
    autocompletar: 'given-name',
    formato: 'Solo se permiten letras',
  },
  {
    nombre: 'apellidos',
    etiqueta: 'Apellidos',
    tipo: 'text',
    autocompletar: 'family-name',
    formato: 'Solo se permiten letras',
  },
  {
    nombre: 'telefono',
    etiqueta: 'Celular',
    tipo: 'tel',
    autocompletar: 'tel',
    formato: 'El celular debe tener el formato 09XXXXXXXX',
    longitud: 10,
    teclado: 'numeric',
  },
  {
    nombre: 'correo',
    etiqueta: 'Correo',
    tipo: 'email',
    autocompletar: 'email',
    formato: 'El correo no es válido',
  },
];

@Component({
  selector: 'app-paciente-formulario',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './paciente-formulario.html',
})
export class PacienteFormulario implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly pacientesService = inject(PacientesService);
  private readonly avisos = inject(AvisoService);
  private readonly router = inject(Router);

  readonly id = input<string>(); // :id de la ruta; vacío al crear

  protected readonly campos = CAMPOS;
  protected readonly hoy = hoyISO();
  protected readonly guardando = signal(false);

  protected readonly formulario = this.fb.group({
    cedula: ['', [Validators.required, cedulaValida]],
    fecha_nacimiento: ['', [Validators.required, fechaNoFutura]],
    nombres: ['', [Validators.required, Validators.pattern(LETRAS)]],
    apellidos: ['', [Validators.required, Validators.pattern(LETRAS)]],
    telefono: ['', [Validators.required, Validators.pattern(CELULAR)]],
    correo: ['', [Validators.required, Validators.pattern(CORREO)]],
  });

  ngOnInit(): void {
    const id = this.id();
    if (id) this.cargar(Number(id));
  }

  protected mensajeError(campo: Campo): string | null {
    const control = this.formulario.controls[campo.nombre];
    if (!control.touched || !control.errors) return null;
    if (control.hasError('servidor')) return control.getError('servidor');
    if (control.hasError('required')) return 'Este campo es obligatorio';
    return campo.formato;
  }

  protected guardar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;

    const id = this.id();
    const datos = this.formulario.getRawValue();
    const peticion = id
      ? this.pacientesService.actualizar(Number(id), datos)
      : this.pacientesService.crear(datos);

    this.guardando.set(true);
    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => {
        this.avisos.exito(id ? 'Paciente actualizado' : 'Paciente registrado');
        this.router.navigate(['/pacientes']);
      },
      error: (error: HttpErrorResponse) => this.mostrarErrores(error),
    });
  }

  private cargar(id: number): void {
    this.pacientesService.obtener(id).subscribe({
      next: (paciente) => this.formulario.patchValue(paciente),
      error: (error: HttpErrorResponse) => {
        this.avisos.error(error.error?.mensaje ?? 'No se pudo cargar el paciente');
        this.router.navigate(['/pacientes']);
      },
    });
  }

  private mostrarErrores(error: HttpErrorResponse): void {
    const errores: Record<string, string> = error.error?.errores ?? {};

    // 409 de la API: la cédula ya está registrada
    if (error.status === 409) errores['cedula'] = error.error.mensaje;

    for (const [campo, mensaje] of Object.entries(errores)) {
      this.formulario.get(campo)?.setErrors({ servidor: mensaje });
    }
    this.avisos.error(error.error?.mensaje ?? 'No se pudo guardar el paciente');
  }
}