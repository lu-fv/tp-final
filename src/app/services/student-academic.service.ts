// src/app/services/student-academic.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Subject, Course, CourseEnrollment, CourseGrade,ExamTable, ExamEnrollment, ExamGrade} from '../core/models'; // 👈 mantiene tu ruta actual
import { map, switchMap, Observable, of, catchError, forkJoin } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StudentAcademicService {
  private http = inject(HttpClient);
  private base = 'http://localhost:3000';

  /** Query param para evitar caché de HttpClient cuando la URL es igual */
  private bust(): string {
    return `_=${Date.now()}`;
  }

  // ---------- GETTERS en español (con alias de compatibilidad) ----------
  materias$(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.base}/subjects`);
  }
  // alias compatibilidad
  subjects$ = this.materias$.bind(this);

  cursos$(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.base}/courses`);
  }
  courses$ = this.cursos$.bind(this);

  inscripcionesCursada$(studentId: number): Observable<CourseEnrollment[]> {
    return this.http.get<CourseEnrollment[]>(
      `${this.base}/course_enrollments?studentId=${studentId}&${this.bust()}`
    );
  }
  courseEnrollments$ = this.inscripcionesCursada$.bind(this);

  notas$(studentId: number): Observable<CourseGrade[]> {
    return this.http.get<CourseGrade[]>(`${this.base}/course_grades?studentId=${studentId}`);
  }
  grades$ = this.notas$.bind(this);

  mesasExamen$(): Observable<ExamTable[]> {
    return this.http.get<ExamTable[]>(`${this.base}/exam_tables`);
  }
  examTables$ = this.mesasExamen$.bind(this);

  inscripcionesExamen$(studentId: number): Observable<ExamEnrollment[]> {
    return this.http.get<ExamEnrollment[]>(
      `${this.base}/exam_enrollments?studentId=${studentId}&${this.bust()}`
    );
  }
  examEnrollments$ = this.inscripcionesExamen$.bind(this);

  notasExamen$(studentId: number): Observable<ExamGrade[]> {
  return this.http.get<ExamGrade[]>(
    `${this.base}/exam_grades?studentId=${studentId}&${this.bust()}`
  );
}

examGrades$ = this.notasExamen$.bind(this);

  

  // ---------- Helpers de estado / correlativas ----------
  /**
   * Arma un mapa: código de materia -> 'aprobado' | 'regular' | 'otro' | null
   * Cruzando grades -> course -> subject (usa courses + subjects)
   */
  buildStatusBySubjectCodeFromCourses(
    subjects: Subject[],
    courses: Course[],
    grades: CourseGrade[]
  ): Record<string, 'aprobado'|'regular'|'otro'|null> {
    const subjectById = new Map<number, Subject>();
    subjects.forEach(s => subjectById.set(Number(s.id), s));

    const subjectCodeStatus: Record<string, 'aprobado'|'regular'|'otro'|null> = {};
    const weight = (x: any) => x === 'aprobado' ? 3 : x === 'regular' ? 2 : x ? 1 : 0;

    grades.forEach(g => {
      const c = courses.find(cc => Number(cc.id) === Number(g.courseId));
      if (!c) return;
      const subj = subjectById.get(Number(c.subjectId));
      if (!subj) return;

      const code = subj.codigo;
      const cond = (g.condicion ?? '').toLowerCase() as 'aprobado'|'regular'|'otro'|'';
      const current = subjectCodeStatus[code] ?? null;
      const newW = weight(cond);
      const oldW = weight(current);

      if (newW >= oldW) {
        subjectCodeStatus[code] = (cond === 'aprobado' || cond === 'regular') ? cond : 'otro';
      }
    });

    return subjectCodeStatus;
  }

  /** Todas las correlativas de 'codes' deben estar en {regular, aprobado} */
  hasAllRegularOrApproved(
    statusMap: Record<string, 'aprobado'|'regular'|'otro'|null>,
    codes: string[]
  ): boolean {
    return codes.every(code => {
      const st = statusMap[code] ?? null;
      return st === 'regular' || st === 'aprobado';
    });
  }

  /** Ya inscripto a un curso */
  isAlreadyEnrolledCourse(courseId: string | number, enrolls: CourseEnrollment[]) {
    return enrolls.some(e => String(e.courseId) === String(courseId) && e.estado === 'inscripto');
  }

  /** Ya inscripto a una mesa */
  isAlreadyEnrolledExam(examTableId: string | number, enrolls: ExamEnrollment[]) {
    return enrolls.some(e => String(e.examTableId) === String(examTableId) && e.estado === 'inscripto');
  }

  /** Capacidad disponible del curso */
  courseHasCapacity(courseId: string | number): Observable<boolean> {
    return this.http.get<Course>(`${this.base}/courses/${courseId}`).pipe(
      switchMap(course =>
        this.http.get<CourseEnrollment[]>(
          `${this.base}/course_enrollments?courseId=${courseId}&estado=inscripto`
        ).pipe(map(enrs => enrs.length < (course?.cupo ?? 0)))
      )
    );
  }

  // ---------- Inscripciones en español (con alias) ----------
  /** Previene duplicados: si ya hay una inscripción ACTIVA para ese curso, no crea otra */
  inscribirCursada(payload: CourseEnrollment): Observable<CourseEnrollment> {
    const { studentId, courseId } = payload as any;
    const urlChk = `${this.base}/course_enrollments?studentId=${studentId}&courseId=${courseId}&estado=inscripto&${this.bust()}`;
    return this.http.get<CourseEnrollment[]>(urlChk).pipe(
      switchMap(existentes => {
        if (existentes?.length) {
          return of(existentes[0]); // ya existe → no duplicar
        }
        return this.http.post<CourseEnrollment>(`${this.base}/course_enrollments`, payload);
      })
    );
  }
  // alias compatibilidad
  enrollCourse = this.inscribirCursada.bind(this);

  inscribirExamen(payload: ExamEnrollment): Observable<ExamEnrollment> {
    return this.http.post<ExamEnrollment>(`${this.base}/exam_enrollments`, payload);
  }
  enrollExam = this.inscribirExamen.bind(this);

  /** BAJA CURSADA: DELETE directo (json-server) */
  bajaCursada(enrollmentId: number | string) {
    const id = String(enrollmentId).trim();
    const url = `${this.base}/course_enrollments/${encodeURIComponent(id)}`;
    return this.http.delete(url);
  }

  /** BAJA EXAMEN: DELETE directo */
  bajaExamen(enrollmentId: number | string) {
    const id = String(enrollmentId).trim();
    const url = `${this.base}/exam_enrollments/${encodeURIComponent(id)}`;
    return this.http.delete(url);
  }

  /** BAJA MASIVA (por si quedaron duplicados): elimina TODAS las activas de un curso */
  bajaTodasCursadasDeCurso(studentId: number | string, courseId: number | string) {
    const q = `studentId=${studentId}&courseId=${courseId}&estado=inscripto&${this.bust()}`;
    const urlList = `${this.base}/course_enrollments?${q}`;
    return this.http.get<CourseEnrollment[]>(urlList).pipe(
      switchMap(list => {
        if (!list?.length) return of(null);
        const dels = list.map(e =>
          this.http.delete(`${this.base}/course_enrollments/${encodeURIComponent(String(e.id))}`)
        );
        return forkJoin(dels);
      })
    );
  }
}
