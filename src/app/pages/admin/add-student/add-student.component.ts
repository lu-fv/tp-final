import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { StudentApiService } from '../../../services/student-api.service';

@Component({
  selector: 'app-add-student',
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
  templateUrl: './add-student.component.html',
  styleUrl: './add-student.component.css',
})
export class AddStudentComponent {
  private fb = inject(FormBuilder);
  private studentService = inject(StudentApiService);

  statusMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  studentForm = this.fb.group({
    studentId: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    nationalId: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [
      '',
      [Validators.required, Validators.pattern(/^\d{4}-\d{3}-\d{4}$/)],
    ],
    status: ['', Validators.required],
    admissionDate: ['', [Validators.required, this.noFutureDateValidator]],
  });

  /** No permitir fechas futuras */
  noFutureDateValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null; // que otro validador se ocupe del required

    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      return { futureDate: true };
    }
    return null;
  }

  private formatDate(d: Date | string | null): string {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  onSubmit() {
    if (!this.studentForm.valid) {
      this.studentForm.markAllAsTouched();
      this.statusMessage.set({
        type: 'error',
        text: 'Formulario inválido. Revise los campos obligatorios.',
      });
      return;
    }

    this.studentService.getLastStudent().subscribe({
      next: (s) => {
        const id = (s + 1).toString();

        const admissionRaw = this.studentForm.get('admissionDate')?.value as
          | Date
          | string
          | null;

        const admissionDate = this.formatDate(admissionRaw);

        this.studentService
          .create(
            id,
            this.studentForm.get('studentId')?.value as string,
            this.studentForm.get('firstName')?.value as string,
            this.studentForm.get('lastName')?.value as string,
            this.studentForm.get('nationalId')?.value as string,
            this.studentForm.get('email')?.value as string,
            this.studentForm.get('phone')?.value as string,
            this.studentForm.get('status')?.value as string,
            admissionDate
          )
          .subscribe({
            next: () => {
              this.statusMessage.set({
                type: 'success',
                text: 'Estudiante creado exitosamente.',
              });
              this.studentForm.reset();
            },
            error: (error) => {
              console.error(error);
              this.statusMessage.set({
                type: 'error',
                text: 'Error al crear el estudiante. Intente nuevamente.',
              });
            },
          });
      },
      error: (error) => {
        console.error(error);
        this.statusMessage.set({
          type: 'error',
          text: 'No se pudo obtener el último estudiante.',
        });
      },
    });
  }
}
