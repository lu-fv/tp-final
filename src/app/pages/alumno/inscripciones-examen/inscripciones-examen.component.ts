import { Component, inject, signal } from '@angular/core';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { StudentAcademicService } from '../../../services/student-academic.service';
import { AuthService } from '../../../core/auth.service';
import { ExamEnrollment, ExamTable, Subject, Course,} from '../../../core/models'; 
import { BehaviorSubject, combineLatest, map, switchMap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-inscripciones-examen',
  imports: [NgIf, NgFor, AsyncPipe],
  templateUrl: './inscripciones-examen.component.html',
  styleUrls: ['./inscripciones-examen.component.css'],
})
export class InscripcionesExamenComponent {
  private aca = inject(StudentAcademicService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  mensaje: string | null = null;
  private refresh$ = new BehaviorSubject<void>(undefined);
  protected studentId = signal<number | null>(null);

  ngOnInit(): void {
    const userIdFromRoute = Number(this.route.snapshot.paramMap.get('id'));
    const currentUserId = this.auth.user()
      ? Number(this.auth.user()?.studentId)
      : null;
    if (
      userIdFromRoute &&
      this.auth.user()?.role === 'alumno' &&
      userIdFromRoute !== currentUserId
    ) {
      this.mensaje =
        'No tienes permiso para ver las inscripciones de otro alumno.';
    } else if (this.auth.user()?.role === 'alumno' && currentUserId) {
      this.studentId.set(currentUserId);
    } else if (this.auth.user()?.role === 'admin' && userIdFromRoute) {
      this.studentId.set(userIdFromRoute);
    }
  }

  vm$ = this.refresh$.pipe(
    switchMap(() =>
      combineLatest({
        subjects: this.aca.materias$(),
        courses: this.aca.cursos$(),
        grades: this.aca.notas$(this.studentId() as number),
        examTbls: this.aca.mesasExamen$(),
        myExamE: this.aca.inscripcionesExamen$(this.studentId() as number),
        myExamGrades: this.aca.notasExamen$(this.studentId() as number),
      })
    ),
    map(({ subjects, courses, grades, examTbls, myExamE, myExamGrades }) => {
      const statusByCode = this.aca.buildStatusBySubjectCodeFromCourses(
        subjects,
        courses,
        grades
      );

      const rows = examTbls
        .map((t) => {
          const subj = subjects.find(
            (s) => Number(s.id) === Number(t.subjectId)
          );
          if (!subj) return null;

          const okCorrel = this.aca.hasAllRegularOrApproved(
            statusByCode,
            subj.correlativasRendir || []
          );
          const meOk =
            statusByCode[subj.codigo] === 'regular' ||
            statusByCode[subj.codigo] === 'aprobado';
          const already = this.aca.isAlreadyEnrolledExam(t.id, myExamE);

          // si ya estoy inscripto, guardo el id de inscripción para poder dar de baja
          const myEnroll = already
            ? myExamE.find(
                (e) =>
                  String(e.examTableId) === String(t.id) &&
                  e.estado === 'inscripto'
              ) ?? null
            : null;
          const myGrade = myExamGrades.find(
            (g) => String(g.examTableId) === String(t.id)
          );
const statusMyGrade = myEnroll && myGrade?.nota ? true : false;
          return { table: t, subject: subj, okCorrel, meOk, already, myEnroll, statusMyGrade };
        })
        .filter(Boolean) as Array<{
        table: ExamTable;
        subject: Subject;
        okCorrel: boolean;
        meOk: boolean;
        already: boolean;
        myEnroll: ExamEnrollment | null;
        statusMyGrade: boolean;
      }>;

      return { rows, statusByCode, myExamE };
    })
  );
  /*
  private studentId(): number {
    return Number(this.auth.user()?.studentId);
  }*/

  inscribirme(t: ExamTable) {
    const sid = this.studentId();
    if (!sid) {
      this.mensaje = 'Sesión sin studentId';
      return;
    }

    const payload: ExamEnrollment = {
      id: undefined as any, 
      studentId: sid,
      examTableId: t.id,
      estado: 'inscripto',
      fecha: new Date().toISOString(),
    };

    this.aca.inscribirExamen(payload).subscribe({
      next: () => {
        this.mensaje = 'Inscripción a mesa realizada.';
        this.refresh$.next();
      },
      error: () => (this.mensaje = 'No se pudo inscribir a la mesa.'),
    });
  }

  darmeDeBaja(enr: ExamEnrollment | null, statusMyGrade: boolean) {
    if(statusMyGrade) return;
    if (!enr?.id) return;
    if (!confirm('¿Confirmás darte de baja de esta mesa?')) return;

    this.aca.bajaExamen(enr.id).subscribe({
      next: () => {
        this.mensaje = 'Baja de mesa realizada.';
        this.refresh$.next();
      },
      error: () => (this.mensaje = 'No se pudo dar de baja la mesa.'),
    });
  }
}
