import { Component, effect, inject, input, signal } from '@angular/core';
import {
  CourseGrade,
  CourseEnrollment,
  Course,
  Subject,
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
  selector: 'app-formulario-cursada',
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
  templateUrl: './formulario-cursada.component.html',
  styleUrl: './formulario-cursada.component.css',
  providers: [CargaNotasService, StudentAcademicService],
})
export class FormularioCursadaComponent {
  private fb = inject(FormBuilder);
  studentId = input<number | null>(null);
  alert = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  private cargaNotasService = inject(CargaNotasService);
  protected materiasCursadas = signal<
    Array<{ id: string | undefined; name: string }>
  >([]);
  private aca = inject(StudentAcademicService);
  private refresh$ = new BehaviorSubject<void>(undefined);

  vm$ = this.refresh$.pipe(
        switchMap(() => {
          const sid = Number(this.studentId());
          return combineLatest({
            subjects: this.aca.materias$(),
            courses: this.aca.cursos$(),
            myEnrolls: this.aca.inscripcionesCursada$(sid),
            grades: this.aca.notas$(sid),
          });
        }),
        map(({ subjects, courses, myEnrolls, grades }) => {
          const rows = myEnrolls
            .map((enroll: CourseEnrollment) => {
              const course = courses.find(
                (c: Course) => c.id === enroll.courseId
              );
              const subject = subjects.find(
                (s: Subject) => s.id === course?.subjectId.toString()
              );
              const grade = grades.find(
                (g: CourseGrade) => g.courseId.toString() === enroll.courseId
              );
              return {
                id: enroll.estado === 'inscripto' ? course?.id : undefined,
                name: subject ? subject.nombre : 'Materia desconocida',
                condicion: grade?.condicion ?? null,
              };
            })
            .filter((row) => row.id !== undefined && row.condicion == null);

          this.materiasCursadas.set(rows);
        })
      );
  constructor() {
    effect(() => {
      const sid = this.studentId();
      if (!sid) return;
      this.vm$.subscribe(() => {
      })
      
    });

    // Suscribirse a cambios en courseId para habilitar/deshabilitar parcial1
    this.courseForm.get('courseId')?.valueChanges.subscribe((value) => {
      this.updateParcial1State();
    });

    // Suscribirse a cambios en parcial1 para habilitar/deshabilitar parcial2
    this.courseForm.get('parcial1')?.valueChanges.subscribe((value) => {
      this.updateParcial2State();
    });

    // Inicializar el estado de los parciales al cargar el componente
    this.updateParcial1State();
    this.updateParcial2State();
  }

  courseForm = this.fb.group({
    id: [''],
    courseId: [0, Validators.required],
    parcial1: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
    parcial2: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
  });

  private updateParcial1State(): void {
    const courseIdControl = this.courseForm.get('courseId');
    const parcial1Control = this.courseForm.get('parcial1');

    const isCourseSelected =
      courseIdControl?.valid &&
      courseIdControl.value !== null &&
      courseIdControl.value !== undefined &&
      courseIdControl.value !== 0;

    if (isCourseSelected) {
      parcial1Control?.enable();
    } else {
      parcial1Control?.disable();
      // Resetear el valor cuando se deshabilita
      if (parcial1Control?.value !== 0) {
        parcial1Control?.setValue(0);
      }
      // También deshabilitar parcial2 si se deshabilita parcial1
      this.updateParcial2State();
    }
  }

  private updateParcial2State(): void {
    const parcial1Control = this.courseForm.get('parcial1');
    const parcial2Control = this.courseForm.get('parcial2');

    const isParcial1Valid =
      parcial1Control?.valid &&
      parcial1Control.value !== null &&
      parcial1Control.value !== undefined &&
      parcial1Control.value >= 6 &&
      parcial1Control.enabled; // Solo si está habilitado

    if (isParcial1Valid) {
      parcial2Control?.enable();
    } else {
      parcial2Control?.disable();
      // Resetear el valor cuando se deshabilita
      if (parcial2Control?.value !== 0) {
        parcial2Control?.setValue(0);
      }
    }
  }

  // Método público para verificar el estado de parcial1 (para usar en el template)
  isParcial1Enabled(): boolean {
    const courseIdControl = this.courseForm.get('courseId');
    if (courseIdControl === null) return false;
    return (
      courseIdControl?.valid &&
      courseIdControl.value !== null &&
      courseIdControl.value !== undefined &&
      courseIdControl.value !== 0
    );
  }

  // Método público para verificar el estado de parcial2 (para usar en el template)
  isParcial2Enabled(): boolean {
    const parcial1Control = this.courseForm.get('parcial1');
    if (parcial1Control === null) return false;
    return (
      parcial1Control?.valid &&
      parcial1Control.value !== null &&
      parcial1Control.value !== undefined &&
      parcial1Control.value >= 6 &&
      parcial1Control.enabled
    );
  }

  // Método para obtener el mensaje de ayuda según el estado
  getParcial1Hint(): string {
    if (!this.isParcial1Enabled()) {
      return 'Seleccione una cursada para habilitar';
    }
    return '';
  }

  getParcial2Hint(): string {
    if (!this.isParcial2Enabled()) {
      if (!this.isParcial1Enabled()) {
        return 'Seleccione una cursada primero';
      }
      return 'Complete el Parcial 1 con nota ≥ 6 para habilitar';
    }
    return '';
  }

  onSubmit() {
    if (this.courseForm.valid) {
      this.cargaNotasService.getlastId().subscribe({
        next: (lastId) => {
          this.courseForm.patchValue({ id: (lastId + 1).toString() });
          const courseGrade: CourseGrade = this.courseForm.value as CourseGrade;
          courseGrade.studentId = this.studentId() as number;
          const promedio = this.calculaProm(
            courseGrade.parcial1,
            courseGrade.parcial2
          );
          courseGrade.promedio = promedio;
          courseGrade.condicion = this.determinaCondicion(
            promedio,
            courseGrade.parcial1,
            courseGrade.parcial2
          );
          this.cargaNotasService.addCourseGrade(courseGrade).subscribe({
            next: (result) => {
              this.alert.set({
                type: 'success',
                text: 'Nota de cursada cargada exitosamente.',
              });
              this.courseForm.reset();
              this.refresh$.next();
              // Restablecer el estado del formulario después del reset
              setTimeout(() => {
                this.updateParcial1State();
                this.updateParcial2State();
              }, 0);
            },
            error: (err) => {
              this.alert.set({
                type: 'error',
                text: 'Error al cargar la nota de cursada.',
              });
              console.error('Error al cargar la nota de cursada:', err);
            },
          });
        },
        error: (err) => {
          this.alert.set({
            type: 'error',
            text: 'Error al obtener el último ID.',
          });
          console.error('Error al obtener el último ID:', err);
        },
      });
    } else {
      this.alert.set({
        type: 'error',
        text: 'Por favor, complete todos los campos correctamente.',
      });
    }
  }

  private calculaProm(
    parcial1: number | undefined,
    parcial2: number | undefined
  ): number | undefined {
    if (parcial1 !== undefined && parcial2 !== undefined) {
      return (parcial1 + parcial2) / 2;
    }
    return undefined;
  }

  private determinaCondicion(
    promedio: number | undefined,
    parcial1?: number,
    parcial2?: number
  ): 'aprobado' | 'regular' | 'libre' | 'desaprobado' {
    if (parcial1 === undefined && parcial2 === undefined) {
      return 'libre';
    } else if (
      parcial1 !== undefined &&
      parcial1 >= 6 &&
      (parcial2 === undefined || parcial2 < 6)
    ) {
      return 'libre';
    } else if (
      parcial1 !== undefined &&
      parcial1 < 6 &&
      parcial2 !== undefined &&
      parcial2 < 6
    ) {
      return 'desaprobado';
    } else if (
      parcial1 !== undefined &&
      parcial1 >= 6 &&
      parcial2 !== undefined &&
      parcial2 < 6
    ) {
      return 'desaprobado';
    } else if (promedio === undefined) {
      return 'libre';
    } else if (promedio >= 8) {
      return 'aprobado';
    } else if (promedio >= 6) {
      return 'regular';
    } else {
      return 'desaprobado';
    }
  }
}
