import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, map, switchMap } from 'rxjs';
import { ElementRef, ViewChild } from '@angular/core';

import { Course, CourseEnrollment, CourseGrade, ExamGrade, ExamTable, Subject,} from '../../../../core/models';
import { CargaNotasService } from '../../../../services/carga-notas.service';
import { StudentAcademicService } from '../../../../services/student-academic.service';

import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

type AlertVM = { type: 'success' | 'error'; text: string } | null;

type SelectOption = { id: string | undefined; name: string; condicion?: string | null };

type RowVM = {
  id: string;
  courseId: string;
  materia: string;
  parcial1: number;
  parcial2: number;
  promedio: number;
  condicion: string;
  locked: boolean;
  lockedReason: string | null;
};

@Component({
  selector: 'app-formulario-cursada',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,],
  templateUrl: './formulario-cursada.component.html',
  styleUrl: './formulario-cursada.component.css',
  providers: [CargaNotasService, StudentAcademicService],
})
export class FormularioCursadaComponent {
  private fb = inject(FormBuilder);
  private cargaNotasService = inject(CargaNotasService);
  private aca = inject(StudentAcademicService);
  private destroyRef = inject(DestroyRef);

  studentId = input<number | null>(null);

  alert = signal<AlertVM>(null);

  @ViewChild('formTop') formTop?: ElementRef<HTMLElement>;


  protected materiasCursadas = signal<SelectOption[]>([]);
  protected courseGradesRows = signal<RowVM[]>([]);
  protected lockedCourseIds = signal<Set<string>>(new Set<string>());

  editingId = signal<string | null>(null);
  isEditing = () => this.editingId() !== null;

  private refresh$ = new BehaviorSubject<void>(undefined);

  courseForm = this.fb.group({
    id: [''],
    courseId: [0, Validators.required],
    parcial1: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0), Validators.max(10)]],
    parcial2: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0), Validators.max(10)]],
  });

  vm$ = this.refresh$.pipe(
    switchMap(() => {
      const sid = Number(this.studentId());
      return combineLatest({
        subjects: this.aca.materias$(),
        courses: this.aca.cursos$(),
        myEnrolls: this.aca.inscripcionesCursada$(sid),
        grades: this.aca.notas$(sid),
        examTbls: this.aca.mesasExamen$(),
        myExamGrades: this.aca.notasExamen$(sid),
      });
    }),
    map(({ subjects, courses, myEnrolls, grades, examTbls, myExamGrades }) => {

      const options = (myEnrolls as CourseEnrollment[])
        .map((enroll) => {
          const course = (courses as Course[]).find((c) => c.id === enroll.courseId);
          const subject = (subjects as Subject[]).find(
            (s) => s.id === course?.subjectId?.toString()
          );
          const grade = (grades as CourseGrade[]).find(
            (g) => g.courseId?.toString() === enroll.courseId
          );

          return {
            id: enroll.estado === 'inscripto' ? course?.id : undefined,
            name: subject ? subject.nombre : 'Materia desconocida',
            condicion: grade?.condicion ?? null,
          };
        })
        .filter((row) => row.id !== undefined && row.condicion == null);

      this.materiasCursadas.set(options);

      const examTableIdsWithFinal = new Set(
        (myExamGrades as ExamGrade[])
          .filter((g) => g?.examTableId !== undefined && g?.examTableId !== null)
          .map((g) => String(g.examTableId))
      );

      const subjectIdsWithFinal = new Set(
        (examTbls as ExamTable[])
          .filter((t) => examTableIdsWithFinal.has(String(t.id)))
          .map((t) => String(t.subjectId))
      );

      const lockedCourses = new Set<string>();
      (courses as Course[]).forEach((c) => {
        if (subjectIdsWithFinal.has(String(c.subjectId))) {
          lockedCourses.add(String(c.id));
        }
      });

      this.lockedCourseIds.set(lockedCourses);

      const rows: RowVM[] = (grades as CourseGrade[])
        .filter((g) => String(g.studentId) === String(this.studentId()))
        .map((g) => {
          const courseIdStr = String(g.courseId);
          const course = (courses as Course[]).find((c) => String(c.id) === courseIdStr);
          const subject = (subjects as Subject[]).find(
            (s) => String(s.id) === String(course?.subjectId)
          );

          const locked = lockedCourses.has(courseIdStr);

          return {
            id: String(g.id),
            courseId: courseIdStr,
            materia: subject?.nombre ?? 'Materia',
            parcial1: Number(g.parcial1 ?? 0),
            parcial2: Number(g.parcial2 ?? 0),
            promedio: Number(g.promedio ?? 0),
            condicion: String(g.condicion ?? ''),
            locked,
            lockedReason: locked ? 'Materia con nota de final vigente' : null,
          };
        });

      this.courseGradesRows.set(rows);
    })
  );

  constructor() {
    effect(() => {
      const sid = this.studentId();
      if (!sid) return;
      this.vm$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    });

    this.courseForm.get('courseId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateParcial1State());

    this.courseForm.get('parcial1')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateParcial2State());

    this.updateParcial1State();
    this.updateParcial2State();
  }

  private updateParcial1State(): void {
    const courseIdControl = this.courseForm.get('courseId');
    const parcial1Control = this.courseForm.get('parcial1');

    const v = Number(courseIdControl?.value);
    const isCourseSelected = !!courseIdControl?.valid && !Number.isNaN(v) && v !== 0;

    if (isCourseSelected) {
      parcial1Control?.enable({ emitEvent: false });
    } else {
      parcial1Control?.disable({ emitEvent: false });
      parcial1Control?.setValue(0, { emitEvent: false });
      this.updateParcial2State();
    }
  }

  private updateParcial2State(): void {
    const parcial1Control = this.courseForm.get('parcial1');
    const parcial2Control = this.courseForm.get('parcial2');

    const p1 = Number(parcial1Control?.value);
    const isParcial1Valid = !!parcial1Control?.enabled && !Number.isNaN(p1) && p1 >= 6;

    if (isParcial1Valid) {
      parcial2Control?.enable({ emitEvent: false });
    } else {
      parcial2Control?.disable({ emitEvent: false });
      parcial2Control?.setValue(0, { emitEvent: false });
    }
  }

  isParcial1Enabled(): boolean {
    const courseIdControl = this.courseForm.get('courseId');
    const v = Number(courseIdControl?.value);
    return !!courseIdControl?.valid && !Number.isNaN(v) && v !== 0;
  }

  isParcial2Enabled(): boolean {
    const parcial1Control = this.courseForm.get('parcial1');
    const p1 = Number(parcial1Control?.value);
    return !!parcial1Control?.enabled && !Number.isNaN(p1) && p1 >= 6;
  }

  getParcial1Hint(): string {
    return this.isParcial1Enabled() ? '' : 'Seleccione una cursada para habilitar';
  }

  getParcial2Hint(): string {
    if (this.isParcial2Enabled()) return '';
    if (!this.isParcial1Enabled()) return 'Seleccione una cursada primero';
    return 'Complete el Parcial 1 con nota ≥ 6 para habilitar';
  }

  onSubmit() {
    if (!this.courseForm.valid) {
      this.alert.set({ type: 'error', text: 'Por favor, complete todos los campos correctamente.' });
      return;
    }

    const sid = this.studentId();
    if (!sid) {
      this.alert.set({ type: 'error', text: 'StudentId inválido.' });
      return;
    }

    const payload: CourseGrade = this.courseForm.getRawValue() as CourseGrade;
    payload.studentId = sid;

    const promedio = this.calculaProm(payload.parcial1, payload.parcial2);
    payload.promedio = promedio;

    payload.condicion = this.determinaCondicion(promedio, payload.parcial1, payload.parcial2);

    const editingId = this.editingId();

    if (editingId) {
      this.cargaNotasService.updateCourseGrade(editingId, payload).subscribe({
        next: () => {
          this.alert.set({ type: 'success', text: 'Nota de cursada actualizada correctamente.' });
          this.cancelEdit(false);
          this.refresh$.next();
        },
        error: (err) => {
          console.error(err);
          this.alert.set({ type: 'error', text: 'Error al actualizar la nota de cursada.' });
        },
      });
      return;
    }

    this.cargaNotasService.getlastId().subscribe({
      next: (lastId) => {
        this.courseForm.patchValue({ id: (Number(lastId) + 1).toString() });

        const newPayload: CourseGrade = this.courseForm.getRawValue() as CourseGrade;
        newPayload.studentId = sid;

        const prom = this.calculaProm(newPayload.parcial1, newPayload.parcial2);
        newPayload.promedio = prom;
        newPayload.condicion = this.determinaCondicion(prom, newPayload.parcial1, newPayload.parcial2);

        this.cargaNotasService.addCourseGrade(newPayload).subscribe({
          next: () => {
            this.alert.set({ type: 'success', text: 'Nota de cursada cargada exitosamente.' });
            this.resetForm();
            this.refresh$.next();
          },
          error: (err) => {
            console.error(err);
            this.alert.set({ type: 'error', text: 'Error al cargar la nota de cursada.' });
          },
        });
      },
      error: (err) => {
        console.error(err);
        this.alert.set({ type: 'error', text: 'Error al obtener el último ID.' });
      },
    });
  }

  private resetForm() {
    this.courseForm.reset({ id: '', courseId: 0, parcial1: 0, parcial2: 0 }, { emitEvent: false });
    this.courseForm.get('parcial1')?.disable({ emitEvent: false });
    this.courseForm.get('parcial2')?.disable({ emitEvent: false });
    this.updateParcial1State();
    this.updateParcial2State();
  }

  cancelEdit(showMsg = true) {
    this.editingId.set(null);
    this.resetForm();
    if (showMsg) this.alert.set({ type: 'success', text: 'Edición cancelada.' });
  }

  private calculaProm(parcial1?: number, parcial2?: number): number | undefined {
    if (parcial1 !== undefined && parcial2 !== undefined) {
      return (Number(parcial1) + Number(parcial2)) / 2;
    }
    return undefined;
  }

  private determinaCondicion(
    promedio: number | undefined,
    parcial1?: number,
    parcial2?: number
  ): 'aprobado' | 'regular' | 'libre' | 'desaprobado' {
    const p1 = Number(parcial1);
    const p2 = Number(parcial2);

    if (parcial1 === undefined && parcial2 === undefined) return 'libre';
    if (!Number.isNaN(p1) && p1 >= 6 && (parcial2 === undefined || p2 < 6)) return 'libre';
    if (!Number.isNaN(p1) && p1 < 6 && !Number.isNaN(p2) && p2 < 6) return 'desaprobado';
    if (!Number.isNaN(p1) && p1 >= 6 && !Number.isNaN(p2) && p2 < 6) return 'desaprobado';

    if (promedio === undefined) return 'libre';
    if (promedio >= 8) return 'aprobado';
    if (promedio >= 6) return 'regular';
    return 'desaprobado';
  }

  onEdit(row: RowVM) {
    if (row.locked) {
      this.alert.set({ type: 'error', text: 'No se puede editar: materia con nota de final vigente.' });
      return;
    }

    this.editingId.set(row.id);

    this.courseForm.patchValue(
      {
        id: row.id,
        courseId: Number(row.courseId),
        parcial1: row.parcial1,
        parcial2: row.parcial2,
      },
      { emitEvent: false }
    );

    this.updateParcial1State();
    this.updateParcial2State();

    setTimeout(() => {
      this.formTop?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);



    this.alert.set({ type: 'success', text: 'Edición habilitada: modifique y presione Actualizar.' });
  }

  onDelete(row: RowVM) {
    if (row.locked) {
      this.alert.set({ type: 'error', text: 'No se puede eliminar: materia con nota de final vigente.' });
      return;
    }

    if (!confirm('¿Seguro que desea eliminar esta nota de cursada?')) return;

    this.cargaNotasService.deleteCourseGrade(row.id).subscribe({
      next: () => {

        if (this.editingId() === row.id) this.cancelEdit(false);

        this.alert.set({ type: 'success', text: 'Nota de cursada eliminada correctamente.' });
        this.refresh$.next();
      },
      error: (err) => {
        console.error(err);
        this.alert.set({ type: 'error', text: 'Error al eliminar la nota de cursada.' });
      },
    });
  }
}
