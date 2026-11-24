// Servicio HTTP del módulo Pacientes: consume /api/pacientes.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DatosPaciente, Paciente } from './paciente.model';

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/pacientes`;

  listar(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.url);
  }

  obtener(id: number): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.url}/${id}`);
  }

  crear(datos: DatosPaciente): Observable<Paciente> {
    return this.http.post<Paciente>(this.url, datos);
  }

  actualizar(id: number, datos: DatosPaciente): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}