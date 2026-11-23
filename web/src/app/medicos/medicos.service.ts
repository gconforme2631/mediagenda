// Servicio HTTP del módulo Médicos: consume /api/medicos.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DatosMedico, Medico } from './medico.model';

@Injectable({ providedIn: 'root' })
export class MedicosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/medicos`;

  listar(): Observable<Medico[]> {
    return this.http.get<Medico[]>(this.url);
  }

  obtener(id: number): Observable<Medico> {
    return this.http.get<Medico>(`${this.url}/${id}`);
  }

  crear(datos: DatosMedico): Observable<Medico> {
    return this.http.post<Medico>(this.url, datos);
  }

  actualizar(id: number, datos: DatosMedico): Observable<Medico> {
    return this.http.put<Medico>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
