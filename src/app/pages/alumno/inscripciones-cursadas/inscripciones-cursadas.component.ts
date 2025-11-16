import { Component, inject, signal } from '@angular/core';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { BehaviorSubject, combineLatest, map, switchMap } from 'rxjs';

import { StudentAcademicService } from '../../../services/student-academic.service';
import { AuthService } from '../../../core/auth.service';
import { Subject, Course, CourseEnrollment } from '../../../core/models';
import { ActivatedRoute } from '@angular/router';

type Row = {
  course: Course;
  subject: Subject;
  okCorrel: boolean;
  already: boolean;
  myEnroll: CourseEnrollment | null;
};

@Component({
  standalone: true,
  selector: 'app-inscripciones-cursadas',
  imports: [NgIf, NgFor, AsyncPipe],
  templateUrl: './inscripciones-cursadas.component.html',
  styleUrls: ['./inscripciones-cursadas.component.css'],
})
export class InscripcionesCursadasComponent {
  private aca = inject(StudentAcademicService);
  private auth = inject(AuthService);
  private route = inject (ActivatedRoute);

  mensaje: string | null = null;
  private refresh$ = new BehaviorSubject<void>(undefined);

   protected studentId = signal<number | null>(null);
  
    ngOnInit(): void {
      const userIdFromRoute = Number(this.route.snapshot.paramMap.get('id'));
      const currentUserId = this.auth.user() ? Number(this.auth.user()?.studentId) : null;
      if (userIdFromRoute && this.auth.user()?.role === 'alumno' && userIdFromRoute !== currentUserId) {
        this.mensaje = 'No tienes permiso para ver las inscripciones de otro alumno.';
      }
      else if (this.auth.user()?.role === 'alumno' && currentUserId) {
        this.studentId.set(currentUserId);
      }
      else if(this.auth.user()?.role === 'admin' && userIdFromRoute){
        this.studentId.set(userIdFromRoute);
      }
    }
  // loading por fila para evitar doble click
  private loading = new Set<string>();
  btnDisabled(courseId: any) { return this.loading.has(String(courseId)); }
  private setLoading(courseId: any, on: boolean) {
    const k = String(courseId);
    on ? this.loading.add(k) : this.loading.delete(k);
  }

  vm$ = this.refresh$.pipe(
    switchMap(() => {
      const sid = Number(this.studentId());
      return combineLatest({
        subjects : this.aca.materias$(),
        courses  : this.aca.cursos$(),
        grades   : this.aca.notas$(sid),
        myEnrolls: this.aca.inscripcionesCursada$(sid),
      });
    }),
    map(({ subjects, courses, grades, myEnrolls }) => {
      const statusByCode = this.aca.buildStatusBySubjectCodeFromCourses(subjects, courses, grades);

      const rows: Row[] = courses.map((c): Row | null => {
        const subj = subjects.find(s => Number(s.id) === Number(c.subjectId));
        if (!subj) return null;

        // correlativas para CURSAR (acepto dos nombres por si el JSON varía)
        const correl = (subj as any).correlativasCursar ?? (subj as any).correlativasParaCursar ?? [];
        const okCorrel = this.aca.hasAllRegularOrApproved(statusByCode, correl as string[]);

        // Considero posibles duplicados activos para el mismo curso
        const inscActivas = myEnrolls.filter(e =>
          String(e.courseId) === String(c.id) && e.estado === 'inscripto'
        );
        const already = inscActivas.length > 0;
        // elijo la más "reciente" por id (si son alfanuméricos, orden lexicográfico)
        const myEnroll = already
          ? inscActivas.sort((a, b) => ('' + b.id).localeCompare('' + a.id))[0]
          : null;

        return { course: c, subject: subj, okCorrel, already, myEnroll };
      }).filter(Boolean) as Row[];

      return { rows, statusByCode, myEnrolls };
    })
  );

  /*private studentId(): number {
    return Number(this.auth.user()?.studentId);
  }*/

  inscribirmeCurso(c: Course) {
    const sid = this.studentId();
    if (!sid) { this.mensaje = 'Sesión sin studentId'; return; }
    if (this.btnDisabled(c.id)) return;

    this.setLoading(c.id, true);
    this.aca.courseHasCapacity(c.id as any).subscribe({
      next: (hayCupo) => {
        if (!hayCupo) { this.mensaje = 'No hay cupo disponible.'; this.setLoading(c.id, false); return; }

        const payload: CourseEnrollment = {
          studentId: sid,
          courseId : c.id as any,
          estado   : 'inscripto',
          fecha    : new Date().toISOString(),
        } as any;

        this.aca.inscribirCursada(payload).subscribe({
          next: () => { this.mensaje = 'Inscripción realizada.'; this.refresh$.next(); },
          error: () => this.mensaje = 'No se pudo realizar la inscripción.',
          complete: () => this.setLoading(c.id, false),
        });
      },
      error: () => { this.mensaje = 'Error verificando cupo.'; this.setLoading(c.id, false); }
    });
  }

  /** Baja MASIVA: elimina todas las inscripciones activas de ese curso (si hubiera duplicados) */
  darmeDeBajaCurso(enr: CourseEnrollment | null, courseId: any) {
    if (!courseId) return;
    if (!confirm('¿Confirmás dar de baja esta cursada?')) return;
    if (this.btnDisabled(courseId)) return;

    const sid = this.studentId() as number;
    this.setLoading(courseId, true);

    this.aca.bajaTodasCursadasDeCurso(sid, courseId).subscribe({
      next: () => { this.mensaje = 'Baja realizada.'; this.refresh$.next(); },
      error: () => this.mensaje = 'No se pudo dar de baja.',
      complete: () => this.setLoading(courseId, false),
    });
  }

  trackRow(_: number, r: Row) { return r.course.id as any; }
}

