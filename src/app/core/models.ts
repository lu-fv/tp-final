export type Rol = 'alumno' | 'admin' | 'profesor';

export interface SessionUser {
  id: number;
  username: string;
  role: Rol;
  token: string;
  nombre?: string;
  studentId?: number | null;
}

export interface Student {
  id: number;
  legajo: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  condicion: string;
  fechaIngreso: string;
}

export interface Profesor {
  id: number;
  username: string;
  password?: string;
  nombre: string;
  role?: 'profesor';
  email?: string;
  telefono?: string;
  direccion?: string;
  dni?: string;
  legajo?: string; 
}

export interface Subject {
  id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  correlativasCursar: string[];
  correlativasRendir: string[];
}

export interface Course {
  id: string;
  subjectId: number;
  anio: number;
  cuatrimestre: number;
  comision: string;
  horario: string;
  cupo: number;
}

export interface CourseEnrollment {
  id?: string | number;
  studentId: number;
  courseId: string | number;
  estado: 'inscripto' | 'baja';
  fecha: string;
}

export interface CourseGrade {
  id: string;
  studentId: number;
  courseId: number;
  parcial1?: number;
  parcial2?: number;
  promedio?: number;
  condicion: 'aprobado' | 'regular' | 'libre' | 'desaprobado';
}

export interface ExamTable {
  id: string;
  subjectId: number;
  fecha: string;
  aula: string;
  turno: string;
  periodo: string;
}

export interface ExamEnrollment {
  id?: string | number;
  studentId: number;
  examTableId: string | number;
  estado: 'inscripto' | 'baja';
  fecha: string;
}

export interface ExamGrade {
  id: string;
  studentId: number;
  examTableId: number | string;
  nota?: number | null;
  resultado: 'aprobado' | 'desaprobado' | 'ausente' | 'libre' | 'otro';
}

export interface Admin {
  id: number;
  username: string;
  password: string;
  nombre: string;
}
