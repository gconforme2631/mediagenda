// Lista de pacientes: carga, búsqueda y eliminación con confirmación.
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AvisoService } from '../../shared/aviso/aviso.service';
import { Paciente } from '../paciente.model';
import { PacientesService } from '../pacientes.service';

@Component({
  selector: 'app-pacientes-lista',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './pacientes-lista.html',
})
export class PacientesLista implements OnInit {
  private readonly pacientesService = inject(PacientesService);
  private readonly avisos = inject(AvisoService);

  protected readonly pacientes = signal<Paciente[]>([]);
  protected readonly busqueda = signal('');
  protected readonly cargando = signal(true);

  protected readonly filtrados = computed(() => {
    const texto = normalizar(this.busqueda());
    return this.pacientes().filter((paciente) =>
      normalizar(`${paciente.cedula} ${paciente.nombres} ${paciente.apellidos}`).includes(texto),
    );
  });

  ngOnInit(): void {
    this.pacientesService
      .listar()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (pacientes) => this.pacientes.set(pacientes),
        error: () => this.avisos.error('No se pudo cargar la lista de pacientes'),
      });
  }

  protected eliminar(paciente: Paciente): void {
    if (!confirm(`¿Eliminar al paciente ${paciente.nombres} ${paciente.apellidos}?`)) return;

    this.pacientesService.eliminar(paciente.id).subscribe({
      next: () => {
        this.pacientes.update((lista) => lista.filter((actual) => actual.id !== paciente.id));
        this.avisos.exito('Paciente eliminado');
      },
      error: (error: HttpErrorResponse) =>
        this.avisos.error(error.error?.mensaje ?? 'No se pudo eliminar el paciente'),
    });
  }

  // YYYY-MM-DD → DD/MM/YYYY
  protected formatoFecha(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}