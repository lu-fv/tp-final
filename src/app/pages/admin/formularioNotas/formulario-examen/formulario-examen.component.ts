import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { BehaviorSubject, combineLatest, map, switchMap } from 'rxjs';

import {
  Course,
  CourseGrade,
  ExamEnrollment,
  ExamGrade,
  ExamTable,
  Subject,
} from '../../../../core/models';
import { CargaNotasService } from '../../../../services/carga-notas.service';
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
    MatNativeDateModule,
  ],
  templateUrl: './formulario-examen.component.html',
  styleUrl: './formulario-examen.component.css',
  providers: [CargaNotasService, StudentAcademicService],
})
export class FormularioExamenComponent {
  private fb = inject(FormBuilder);
  private aca = inject(StudentAcademicService);
  private cargaNotasService = inject(CargaNotasService);

  studentId = input<number | null>(null);

  alert = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  materiasAprobadas = signal<Array<{ id: string | undefined; name: string }>>(
    []
  );

  examGradesRows = signal<
    Array<{
      id: string;
      examTableId: string;
      materia: string;
      nota: number;
      resultado: string;
    }>
  >([]);

  editingId = signal<string | null>(null);

  private refresh$ = new BehaviorSubject<void>(undefined);

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

      const rowsForSelect = examTbls
        .map((t) => {
          const subj = subjects.find((s) => Number(s.id) === Number(t.subjectId));
          if (!subj) return null;

          const already = this.aca.isAlreadyEnrolledExam(t.id, myExamE);
          const myEnroll = already
            ? myExamE.find(
                (e) =>
                  String(e.examTableId) === String(t.id) && e.estado === 'inscripto'
              ) ?? null
            : null;

          const myGrade = myExamGrades.find(
            (g) => String(g.examTableId) === String(t.id)
          );

          return {
            id: t.id,
            name: subj.nombre,
            status: myEnroll && myGrade?.nota === undefined ? true : false,
          };
        })
        .filter((row) => row?.status) as Array<{ id: string | undefined; name: string }>;

      this.materiasAprobadas.set(rowsForSelect);

      const rowsTable = myExamGrades
        .map((g) => {
          const t = examTbls.find((et) => String(et.id) === String(g.examTableId));
          const subj = subjects.find((s) => Number(s.id) === Number(t?.subjectId));
          return {
            id: String(g.id),
            examTableId: String(g.examTableId),
            materia: subj?.nombre ?? 'Materia',
            nota: Number(g.nota),
            resultado: String(g.resultado ?? ''),
          };
        })
        .sort((a, b) => a.materia.localeCompare(b.materia));

      this.examGradesRows.set(rowsTable);
    })
  );

  constructor() {
    effect(() => {
      const sid = this.studentId();
      if (!sid) return;
      this.vm$.subscribe(() => {});
    });

    this.examForm.get('examTableId')?.valueChanges.subscribe(() => {
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

    const isSelected =
      examTableIdControl?.valid &&
      examTableIdControl.value !== null &&
      examTableIdControl.value !== undefined &&
      Number(examTableIdControl.value) !== 0;

    if (isSelected) {
      notaControl?.enable({ emitEvent: false });
    } else {
      notaControl?.disable({ emitEvent: false });
      notaControl?.setValue(0, { emitEvent: false });
    }
  }

  isNotaEnabled(): boolean {
    const examTableIdControl = this.examForm.get('examTableId');
    const v = Number(examTableIdControl?.value);
    return !!v && v !== 0;
  }

  getNotaHint(): string {
    return !this.isNotaEnabled() ? 'Seleccione una cursada para habilitar' : '';
  }

  private determinaCondicion(nota: number): 'aprobado' | 'desaprobado' | 'ausente' | 'libre' | 'otro' {
    if (nota === undefined || Number.isNaN(nota)) return 'ausente';
    return nota >= 6 ? 'aprobado' : 'desaprobado';
  }

  onEdit(row: { id: string; examTableId: string; nota: number }) {
    this.editingId.set(row.id);

    this.examForm.patchValue(
      {
        id: row.id,
        examTableId: Number(row.examTableId),
        nota: Number(row.nota),
      },
      { emitEvent: false }
    );

    this.updateNotaState();
    this.examForm.markAsPristine();
    this.examForm.markAsUntouched();
    this.alert.set(null);
  }

  onCancelEdit() {
    this.editingId.set(null);
    this.resetFormClean();
  }

  onDelete(row: { id: string }) {
    const ok = confirm('¿Eliminar esta nota de examen?');
    if (!ok) return;

    this.cargaNotasService.deleteExamGrade(String(row.id)).subscribe({
      next: () => {
        this.alert.set({ type: 'success', text: 'Nota eliminada.' });
        if (this.editingId() === String(row.id)) this.onCancelEdit();
        this.refresh$.next();
      },
      error: () => {
        this.alert.set({ type: 'error', text: 'No se pudo eliminar la nota.' });
      },
    });
  }

  onSubmit() {
    if (this.examForm.invalid) {
      this.alert.set({ type: 'error', text: 'Por favor, complete todos los campos correctamente.' });
      this.examForm.markAllAsTouched();
      return;
    }

    const sid = Number(this.studentId());
    const examTableId = String(this.examForm.value.examTableId);
    const nota = Number(this.examForm.value.nota);

    const editing = this.editingId();

    if (editing) {
      const payload: ExamGrade = {
        id: String(editing),
        studentId: sid,
        examTableId,
        nota,
        resultado: this.determinaCondicion(nota),
      };

      this.cargaNotasService.updateExamGrade(String(editing), payload).subscribe({
        next: () => {
          this.alert.set({ type: 'success', text: 'Nota actualizada correctamente.' });
          this.editingId.set(null);
          this.resetFormClean();
          this.refresh$.next();
        },
        error: () => {
          this.alert.set({ type: 'error', text: 'Hubo un error al actualizar la nota.' });
        },
      });

      return;
    }

    this.cargaNotasService.getlastExamGradeId().subscribe({
      next: (lastId) => {
        const newId = (Number(lastId) + 1).toString();
        const payload: ExamGrade = {
          id: newId,
          studentId: sid,
          examTableId,
          nota,
          resultado: this.determinaCondicion(nota),
        };

        this.cargaNotasService.addExamGrade(payload).subscribe({
          next: () => {
            this.alert.set({ type: 'success', text: 'La nota de examen se ha registrado correctamente.' });
            this.resetFormClean();
            this.refresh$.next();
          },
          error: () => {
            this.alert.set({ type: 'error', text: 'Hubo un error al registrar la nota de examen.' });
          },
        });
      },
      error: () => {
        this.alert.set({ type: 'error', text: 'Hubo un error al obtener el último ID de nota de examen.' });
      },
    });
  }

  private resetFormClean() {
    this.examForm.reset(
      { id: '', examTableId: 0, nota: 0 },
      { emitEvent: false }
    );
    this.updateNotaState();
    this.examForm.markAsPristine();
    this.examForm.markAsUntouched();
  }
}
