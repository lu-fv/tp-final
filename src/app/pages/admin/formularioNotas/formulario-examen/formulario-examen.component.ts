import { Component, effect, inject, input, signal } from '@angular/core';
import {
  CourseGrade,
  CourseEnrollment,
  Course,
  Subject,
  ExamTable,
  ExamEnrollment,
  ExamGrade,
} from '../../../../core/models';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CargaNotasService } from '../../../../services/carga-notas.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { BehaviorSubject, combineLatest, map, switchMap } from 'rxjs';
import { StudentAcademicService } from '../../../../services/student-academic.service';

@Component({
  selector: 'app-formulario-examen',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './formulario-examen.component.html',
  styleUrl: './formulario-examen.component.css',
  providers: [CargaNotasService, StudentAcademicService],
})
export class FormularioExamenComponent {
  private fb = inject(FormBuilder);
  studentId = input<number | null>(null);
  alert = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  protected materiasAprobadas = signal<
    Array<{ id: string | undefined; name: string }>
  >([]);
  private aca = inject(StudentAcademicService);
  private refresh$ = new BehaviorSubject<void>(undefined);
private cargaNotasService = inject(CargaNotasService);

  vm$ = this.refresh$.pipe(
    switchMap(() => {
      const sid = Number(this.studentId());
      return combineLatest({
        subjects: this.aca.materias$(),
        courses: this.aca.cursos$(),
        grades: this.aca.notas$(sid),
        examTbls: this.aca.mesasExamen$(),
        myExamE: this.aca.inscripcionesExamen$(sid),
        myExamGrades: this.aca.notasExamen$(sid),
      });
    }),
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

          //return { table: t, subject: subj, okCorrel, meOk, already, myEnroll };
          return {
            id: t.id,
            name: subj.nombre,
            status: myEnroll && myGrade?.nota === undefined ? true : false,
          }
        })
        .filter((row) => row?.status) as Array<{ id: string | undefined; name: string }>;
       this.materiasAprobadas.set(rows);
    })
  );

  constructor() {
    effect(() => {
      const sid = this.studentId();
      if (!sid) return;
      this.vm$.subscribe(() => {});
    });

    this.examForm.get('examTableId')?.valueChanges.subscribe((value) => {
      this.updateNotaState();
    });

    this.updateNotaState();
  }

  examForm = this.fb.group({
    id: [''],
    examTableId: [0, Validators.required],
    nota: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
  });

  private updateNotaState(): void {
    const examTableIdControl = this.examForm.get('examTableId');
    const notaControl = this.examForm.get('nota');

    const isExamTableSelected =
      examTableIdControl?.valid &&
      examTableIdControl.value !== null &&
      examTableIdControl.value !== undefined &&
      examTableIdControl.value !== 0;

    if (isExamTableSelected) {
      notaControl?.enable();
    } else {
      notaControl?.disable();
      if (notaControl?.value !== 0) {
        notaControl?.setValue(0);
      }
    }
  }

  isNotaEnabled(): boolean {
    const examTableIdControl = this.examForm.get('examTableId');
    if (examTableIdControl === null) return false;
    return (
      examTableIdControl?.valid &&
      examTableIdControl.value !== null &&
      examTableIdControl.value !== undefined &&
      examTableIdControl.value !== 0
    );
  }

  // Método para obtener el mensaje de ayuda según el estado
  getNotaHint(): string {
    if (!this.isNotaEnabled()) {
      return 'Seleccione una cursada para habilitar';
    }
    return '';
  }

  onSubmit() {
    if (this.examForm.valid) {
      this.cargaNotasService
        .getlastExamGradeId()
        .subscribe({
          next: (lastId) => {
            const newIdNumber = Number(lastId) + 1;
            const newId = newIdNumber.toString();
            const sid = Number(this.studentId());
            const examGrade: ExamGrade = {
              id: newId,
              studentId: sid,
              examTableId: String(this.examForm.value.examTableId),
              nota: Number(this.examForm.value.nota),
              resultado: this.determinaCondicion(Number(this.examForm.value.nota)),
            };
            this.cargaNotasService.addExamGrade(examGrade).subscribe({
              next: () => {
                this.alert.set({
                  type: 'success',
                  text: 'La nota de examen se ha registrado correctamente.',
                });
                this.examForm.reset();
                this.refresh$.next();
              },
              error: () => {
                this.alert.set({
                  type: 'error',
                  text: 'Hubo un error al registrar la nota de examen.',
                });
              },
            });
          },
          error: () => {
            this.alert.set({
              type: 'error',
              text: 'Hubo un error al obtener el último ID de nota de examen.',
            });
          },
        })
       
    } else {
      this.alert.set({
        type: 'error',
        text: 'Por favor, complete todos los campos correctamente.',
      });
    }
  }

  private determinaCondicion(
    nota: number
  ): 'aprobado' | 'desaprobado' | 'ausente' | 'libre' | 'otro'{
    if (nota === undefined) {
      return 'ausente';
    } else if (nota >= 6) {
      return 'aprobado';
    } else {
      return 'desaprobado';
    }
  }
}
