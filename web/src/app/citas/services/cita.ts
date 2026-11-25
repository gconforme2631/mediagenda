import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

//#region INTERFACES

export type EstadoCita =
  | 'programada'
  | 'atendida'
  | 'cancelada';

export interface Cita {

  id?: number;
  paciente_id: number;
  medico_id: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado: EstadoCita;

}

export interface CitaDetalle extends Cita {

  paciente_nombres: string;
  paciente_apellidos: string;
  paciente_cedula: string;

  medico_nombres: string;
  medico_apellidos: string;
  medico_especialidad: string;

}

export interface HorarioDisponible {

  hora: string;
  disponible: boolean;
  transcurrido: boolean;
  ocupado: boolean;
}

//#endregion

@Injectable({
  providedIn: 'root'
})
export class Citas {

  //#region INYECCIONES

  private readonly http = inject(HttpClient);

  //#endregion

  //#region CONFIGURACION

  private readonly apiUrl =
    'http://localhost:3000/api/citas';

  //#endregion

  //#region CONSULTAS

  obtenerCitas(): Observable<CitaDetalle[]> {

    return this.http.get<CitaDetalle[]>(
      this.apiUrl
    );

  }

  obtenerCitaPorId(
    id: number
  ): Observable<CitaDetalle> {

    return this.http.get<CitaDetalle>(
      `${this.apiUrl}/${id}`
    );

  }

  obtenerCitasPorPaciente(
    pacienteId: number
  ): Observable<CitaDetalle[]> {

    const params = new HttpParams()
      .set('paciente_id', pacienteId);

    return this.http.get<CitaDetalle[]>(
      this.apiUrl,
      { params }
    );

  }

  obtenerCitasPorMedico(
    medicoId: number
  ): Observable<CitaDetalle[]> {

    const params = new HttpParams()
      .set('medico_id', medicoId);

    return this.http.get<CitaDetalle[]>(
      this.apiUrl,
      { params }
    );

  }

  obtenerCitasPorFecha(
    fecha: string
  ): Observable<CitaDetalle[]> {

    const params = new HttpParams()
      .set('fecha', fecha);

    return this.http.get<CitaDetalle[]>(
      this.apiUrl,
      { params }
    );

  }

  //#endregion

  //#region REGISTRO

  crearCita(
    cita: Cita
  ): Observable<Cita> {

    return this.http.post<Cita>(
      this.apiUrl,
      cita
    );

  }

  //#endregion

  //#region ACTUALIZACION

  actualizarCita(
    id: number,
    cita: Cita
  ): Observable<Cita> {

    return this.http.put<Cita>(
      `${this.apiUrl}/${id}`,
      cita
    );

  }

  //#endregion

  //#region ESTADOS

  cambiarEstado(
    id: number,
    estado: EstadoCita
  ): Observable<Cita> {

    return this.http.patch<Cita>(
      `${this.apiUrl}/${id}/estado`,
      { estado }
    );

  }

  cancelarCita(
    id: number
  ): Observable<Cita> {

    return this.cambiarEstado(
      id,
      'cancelada'
    );

  }

  atenderCita(
    id: number
  ): Observable<Cita> {

    return this.cambiarEstado(
      id,
      'atendida'
    );

  }

  //#endregion

  //#region DISPONIBILIDAD

  obtenerHorariosDisponibles(
    medicoId: number,
    pacienteId: number,
    fecha: string
  ): Observable<HorarioDisponible[]> {

    const params = new HttpParams()
      .set('medico_id', medicoId)
      .set('paciente_id', pacienteId)
      .set('fecha', fecha);

    return this.http.get<HorarioDisponible[]>(
      `${this.apiUrl}/disponibilidad`,
      { params }
    );

  }

  //#endregion

}
