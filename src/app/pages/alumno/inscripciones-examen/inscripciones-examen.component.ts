import { Component, inject } from '@angular/core';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { StudentAcademicService } from '../../../services/student-academic.service';
import { AuthService } from '../../../core/auth.service';
import { ExamEnrollment, ExamTable, Subject, Course } from '../../../core/models'; // 👈 ruta
import { BehaviorSubject, combineLatest, map, switchMap } from 'rxjs';

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

  mensaje: string | null = null;
  private refresh$ = new BehaviorSubject<void>(undefined);

  vm$ = this.refresh$.pipe(
    switchMap(() => combineLatest({
      subjects: this.aca.materias$(),
      courses : this.aca.cursos$(),
      grades  : this.aca.notas$(Number(this.auth.user()?.studentId)),
      examTbls: this.aca.mesasExamen$(),
      myExamE : this.aca.inscripcionesExamen$(Number(this.auth.user()?.studentId)),
    })),
    map(({subjects, courses, grades, examTbls, myExamE}) => {
      const statusByCode = this.aca.buildStatusBySubjectCodeFromCourses(subjects, courses, grades);

      const rows = examTbls.map(t => {
        const subj = subjects.find(s => Number(s.id) === Number(t.subjectId));
        if (!subj) return null;

        const okCorrel = this.aca.hasAllRegularOrApproved(statusByCode, subj.correlativasRendir || []);
        const meOk = (statusByCode[subj.codigo] === 'regular' || statusByCode[subj.codigo] === 'aprobado');
        const already = this.aca.isAlreadyEnrolledExam(t.id, myExamE);

        // si ya estoy inscripto, guardo el id de inscripción para poder dar de baja
        const myEnroll = already
          ? myExamE.find(e => String(e.examTableId) === String(t.id) && e.estado === 'inscripto') ?? null
          : null;

        return { table: t, subject: subj, okCorrel, meOk, already, myEnroll };
      }).filter(Boolean) as Array<{
        table: ExamTable; subject: Subject; okCorrel: boolean; meOk: boolean;
        already: boolean; myEnroll: ExamEnrollment | null;
      }>;

      return { rows, statusByCode, myExamE };
    })
  );

  private studentId(): number {
    return Number(this.auth.user()?.studentId);
  }

  inscribirme(t: ExamTable) {
    const sid = this.studentId();
    if (!sid) { this.mensaje = 'Sesión sin studentId'; return; }

    const payload: ExamEnrollment = {
      id: undefined as any, // json-server asigna
      studentId: sid,
      examTableId: t.id,
      estado: 'inscripto',
      fecha: new Date().toISOString()
    };

    this.aca.inscribirExamen(payload).subscribe({
      next: () => { this.mensaje = 'Inscripción a mesa realizada.'; this.refresh$.next(); },
      error: () => this.mensaje = 'No se pudo inscribir a la mesa.'
    });
  }

  darmeDeBaja(enr: ExamEnrollment | null) {
    if (!enr?.id) return;
    if (!confirm('¿Confirmás darte de baja de esta mesa?')) return;

    this.aca.bajaExamen(enr.id).subscribe({
      next: () => { this.mensaje = 'Baja de mesa realizada.'; this.refresh$.next(); },
      error: () => this.mensaje = 'No se pudo dar de baja la mesa.'
    });
  }
}
