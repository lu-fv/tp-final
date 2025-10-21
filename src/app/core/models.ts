export type Rol = 'alumno' | 'admin';

export interface SessionUser {
  id: number;
  username: string;
  nombre: string;
  rol: Rol;
  token: string;
}
