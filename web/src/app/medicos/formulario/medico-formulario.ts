// Formulario de médicos: registra uno nuevo o edita el indicado en la ruta.
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AvisoService } from '../../shared/aviso/aviso.service';
import { DatosMedico } from '../medico.model';
import { MedicosService } from '../medicos.service';

const LETRAS = /^ *[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: +[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)* *$/;
const CELULAR = /^09\d{8}$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Campo {
  nombre: keyof DatosMedico;
  etiqueta: string;
  tipo: string;
  autocompletar: string;
  formato: string;
  completo?: boolean;
}

const CAMPOS: Campo[] = [
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
    nombre: 'especialidad',
    etiqueta: 'Especialidad',
    tipo: 'text',
    autocompletar: 'off',
    formato: 'Solo se permiten letras',
    completo: true,
  },
  {
    nombre: 'telefono',
    etiqueta: 'Celular',
    tipo: 'tel',
    autocompletar: 'tel',
    formato: 'El celular debe tener el formato 09XXXXXXXX',
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
  selector: 'app-medico-formulario',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './medico-formulario.html',
})
export class MedicoFormulario implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly medicosService = inject(MedicosService);
  private readonly avisos = inject(AvisoService);
  private readonly router = inject(Router);

  readonly id = input<string>(); // :id de la ruta; vacío al crear

  protected readonly campos = CAMPOS;
  protected readonly guardando = signal(false);

  protected readonly formulario = this.fb.group({
    nombres: ['', [Validators.required, Validators.pattern(LETRAS)]],
    apellidos: ['', [Validators.required, Validators.pattern(LETRAS)]],
    especialidad: ['', [Validators.required, Validators.pattern(LETRAS)]],
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
      ? this.medicosService.actualizar(Number(id), datos)
      : this.medicosService.crear(datos);

    this.guardando.set(true);
    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => {
        this.avisos.exito(id ? 'Médico actualizado' : 'Médico registrado');
        this.router.navigate(['/medicos']);
      },
      error: (error: HttpErrorResponse) => this.mostrarErrores(error),
    });
  }

  private cargar(id: number): void {
    this.medicosService.obtener(id).subscribe({
      next: (medico) => this.formulario.patchValue(medico),
      error: (error: HttpErrorResponse) => {
        this.avisos.error(error.error?.mensaje ?? 'No se pudo cargar el médico');
        this.router.navigate(['/medicos']);
      },
    });
  }

  private mostrarErrores(error: HttpErrorResponse): void {
    const errores: Record<string, string> = error.error?.errores ?? {};
    for (const [campo, mensaje] of Object.entries(errores)) {
      this.formulario.get(campo)?.setErrors({ servidor: mensaje });
    }
    this.avisos.error(error.error?.mensaje ?? 'No se pudo guardar el médico');
  }
}
