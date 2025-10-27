export type Rol = 'alumno' | 'admin';

export interface SessionUser {
  id: number;
  username: string;
  role: Rol;
  token: string;
  nombre?: string;         
  studentId?: number|null; 
}

export interface Student {
  id: number;
  legajo: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  condicion: string;      // "regular"
  fechaIngreso: string;   // "YYYY-MM-DD"
}
