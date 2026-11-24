// Modelo de un paciente tal como lo devuelve la API.
export interface Paciente {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string; // YYYY-MM-DD
  telefono: string;
  correo: string;
}

export type DatosPaciente = Omit<Paciente, 'id'>;