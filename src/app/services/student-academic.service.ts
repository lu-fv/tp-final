// src/app/services/student-academic.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Subject, Course, CourseEnrollment, CourseGrade,ExamTable, ExamEnrollment, ExamGrade} from '../core/models'; // 👈 mantiene tu ruta actual
import { map, switchMap, Observable, of, catchError, forkJoin, combineLatest } from 'rxjs';
import { DatePipe } from '@angular/common';
import { Student } from '../core/models';

export interface DebtPayment {
  id?: string | number;
  studentId: number;
  courseId: string | number;
  installment: number;     // 1..4
  amount: number;          // 20000
  date: string;            // ISO
  concept: string;         // texto libre (ej: "Cursada 95-1121 - cuota 1")
}

@Injectable({ providedIn: 'root' })
export class StudentAcademicService {
  private http = inject(HttpClient);
  private base = 'http://localhost:3000';

  /** Query param para evitar caché de HttpClient cuando la URL es igual */
  private bust(): string {
    return `_=${Date.now()}`;
  }

 
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

student$(studentId: number) {
  return this.http.get<Student>(`${this.base}/students/${studentId}`);
}


  

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

  
  hasAllRegularOrApproved(
    statusMap: Record<string, 'aprobado'|'regular'|'otro'|null>,
    codes: string[]
  ): boolean {
    return codes.every(code => {
      const st = statusMap[code] ?? null;
      return st === 'regular' || st === 'aprobado';
    });
  }

 
  isAlreadyEnrolledCourse(courseId: string | number, enrolls: CourseEnrollment[]) {
    return enrolls.some(e => String(e.courseId) === String(courseId) && e.estado === 'inscripto');
  }

  
  isAlreadyEnrolledExam(examTableId: string | number, enrolls: ExamEnrollment[]) {
    return enrolls.some(e => String(e.examTableId) === String(examTableId) && e.estado === 'inscripto');
  }

  
  courseHasCapacity(courseId: string | number): Observable<boolean> {
    return this.http.get<Course>(`${this.base}/courses/${courseId}`).pipe(
      switchMap(course =>
        this.http.get<CourseEnrollment[]>(
          `${this.base}/course_enrollments?courseId=${courseId}&estado=inscripto`
        ).pipe(map(enrs => enrs.length < (course?.cupo ?? 0)))
      )
    );
  }

 
  inscribirCursada(payload: CourseEnrollment): Observable<CourseEnrollment> {
    const { studentId, courseId } = payload as any;
    const urlChk = `${this.base}/course_enrollments?studentId=${studentId}&courseId=${courseId}&estado=inscripto&${this.bust()}`;
    return this.http.get<CourseEnrollment[]>(urlChk).pipe(
      switchMap(existentes => {
        if (existentes?.length) {
          return of(existentes[0]); 
        }
        return this.http.post<CourseEnrollment>(`${this.base}/course_enrollments`, payload);
      })
    );
  }
 
  enrollCourse = this.inscribirCursada.bind(this);

  inscribirExamen(payload: ExamEnrollment): Observable<ExamEnrollment> {
    return this.http.post<ExamEnrollment>(`${this.base}/exam_enrollments`, payload);
  }
  enrollExam = this.inscribirExamen.bind(this);

  
  bajaCursada(enrollment: CourseEnrollment) {
  const id = String(enrollment.id);

  return this.deletePaymentsByCourse(enrollment.studentId, enrollment.courseId).pipe(
    switchMap(() =>
      this.http.delete(`${this.base}/course_enrollments/${id}`)
    )
  );
}


  
  bajaExamen(enrollmentId: number | string) {
    const id = String(enrollmentId).trim();
    const url = `${this.base}/exam_enrollments/${encodeURIComponent(id)}`;
    return this.http.delete(url);
  }

  
  bajaTodasCursadasDeCurso(studentId: number, courseId: string | number): Observable<any> {
  const cid = String(courseId);

  
  return this.deletePaymentsByCourse(studentId, cid).pipe(
    
    switchMap(() =>
      this.http.get<CourseEnrollment[]>(
        `${this.base}/course_enrollments?studentId=${studentId}&courseId=${cid}`
      )
    ),
   
    switchMap(enrolls => {
      if (!enrolls.length) return of(null);

      const deletes = enrolls.map(e =>
        this.http.delete(`${this.base}/course_enrollments/${e.id}`)
      );
      return combineLatest(deletes);
    })
  );
}



  payments$(studentId: number) {
  return this.http.get<DebtPayment[]>(`${this.base}/payments?studentId=${studentId}&${this.bust()}`);
}

pay$(payload: DebtPayment) {
  return this.http.post<DebtPayment>(`${this.base}/payments`, payload);
}

buildInstallmentDueDates(course: Course): string[] {
  const year = Number(course.anio);
  const cuat = Number(course.cuatrimestre);
  const months = cuat === 1 ? [3,4,5,6] : [8,9,10,11];
  return months.map(m => new Date(Date.UTC(year, m - 1, 10)).toISOString());
}

deletePaymentsByCourse(studentId: number, courseId: string | number) {
  return this.http.get<DebtPayment[]>(
    `${this.base}/payments?studentId=${studentId}&courseId=${courseId}`
  ).pipe(
    switchMap(payments => {
      const deletes = payments.map(p =>
        this.http.delete(`${this.base}/payments/${p.id}`)
      );
      return combineLatest(deletes.length ? deletes : [of(null)]);
    })
  );
}



}
