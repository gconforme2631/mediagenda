// Modelo de un médico tal como lo devuelve la API.
export interface Medico {
  id: number;
  nombres: string;
  apellidos: string;
  especialidad: string;
  telefono: string;
  correo: string;
}

export type DatosMedico = Omit<Medico, 'id'>;
