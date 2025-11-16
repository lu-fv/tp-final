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

export interface Subject {
  id: string;           // en tu json es string
  codigo: string;
  nombre: string;
  creditos: number;
  correlativasCursar: string[];  // lista de códigos (ej: "95-1121")
  correlativasRendir: string[];
}

export interface Course {
  id: string;           // string en el json
  subjectId: number;    // ojo: en json es number
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
  fecha: string; // ISO
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
  subjectId: number;     // number en json
  fecha: string;         // YYYY-MM-DD
  aula: string;
  turno: string;
  periodo: string;
}

export interface ExamEnrollment {
  id?: string | number;
  studentId: number;
  examTableId: string | number;
  estado: 'inscripto' | 'baja';
  fecha: string; // ISO
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
