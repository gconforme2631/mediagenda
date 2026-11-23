// Lista de médicos: carga, búsqueda y eliminación con confirmación.
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AvisoService } from '../../shared/aviso/aviso.service';
import { Medico } from '../medico.model';
import { MedicosService } from '../medicos.service';

@Component({
  selector: 'app-medicos-lista',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './medicos-lista.html',
})
export class MedicosLista implements OnInit {
  private readonly medicosService = inject(MedicosService);
  private readonly avisos = inject(AvisoService);

  protected readonly medicos = signal<Medico[]>([]);
  protected readonly busqueda = signal('');
  protected readonly cargando = signal(true);

  protected readonly filtrados = computed(() => {
    const texto = normalizar(this.busqueda());
    return this.medicos().filter((medico) =>
      normalizar(`${medico.nombres} ${medico.apellidos} ${medico.especialidad}`).includes(texto),
    );
  });

  ngOnInit(): void {
    this.medicosService
      .listar()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (medicos) => this.medicos.set(medicos),
        error: () => this.avisos.error('No se pudo cargar la lista de médicos'),
      });
  }

  protected eliminar(medico: Medico): void {
    if (!confirm(`¿Eliminar al médico ${medico.nombres} ${medico.apellidos}?`)) return;

    this.medicosService.eliminar(medico.id).subscribe({
      next: () => {
        this.medicos.update((lista) => lista.filter((actual) => actual.id !== medico.id));
        this.avisos.exito('Médico eliminado');
      },
      error: (error: HttpErrorResponse) =>
        this.avisos.error(error.error?.mensaje ?? 'No se pudo eliminar el médico'),
    });
  }
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
