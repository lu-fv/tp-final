import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { StudentApiService } from '../../../services/student-api.service';
import { Student } from '../../../core/models';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-add-student',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,],
  templateUrl: './add-student.component.html',
  styleUrls: ['./add-student.component.css'],
})
export class AddStudentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private studentApi = inject(StudentApiService);

  studentId = signal<string | null>(null);
  editMode = signal(false);
  isLoading = signal(true);

  statusMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  studentForm = new FormGroup({
    legajo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    apellido: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dni: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    telefono: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    condicion: new FormControl('regular', { nonNullable: true, validators: [Validators.required] }),
    fechaIngreso: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    const id = (this.route.snapshot.queryParamMap.get('id') ?? '').trim();

    const edit = id.length > 0;
    this.editMode.set(edit);
    this.studentId.set(edit ? id : null);

    this.statusMessage.set(null);
    this.isLoading.set(true);

    if (edit) {
      this.studentForm.disable({ emitEvent: false });
      this.cargarAlumno(id);
      return;
    }

    this.inicializarAlta();
  }

  private inicializarAlta(): void {
    this.studentForm.reset(
      {
        legajo: '',
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: '',
        condicion: 'regular',
        fechaIngreso: '',
      },
      { emitEvent: false }
    );

    this.studentForm.enable({ emitEvent: false });
    this.studentForm.get('legajo')?.disable({ emitEvent: false });

    this.isLoading.set(true);

    this.studentApi.getAll().subscribe({
      next: (students) => {
        const legajo = this.calcularSiguienteLegajo(students ?? []);
        this.studentForm.patchValue({ legajo }, { emitEvent: false });

        this.studentForm.get('legajo')?.disable({ emitEvent: false });

        this.isLoading.set(false);
      },
      error: () => {
        this.studentForm.get('legajo')?.enable({ emitEvent: false });
        this.isLoading.set(false);
      },
    });
  }

  private calcularSiguienteLegajo(students: Student[]): string {
    const yearActual = new Date().getFullYear();

    const parsed = (students ?? [])
      .map((s: any) => String(s?.legajo ?? '').trim())
      .map((legajo) => {
        const m = legajo.match(/^MDP-(\d{4})-(\d{3})$/);
        if (!m) return null;
        return { year: Number(m[1]), n: Number(m[2]) };
      })
      .filter(Boolean) as Array<{ year: number; n: number }>;

    const year = parsed.length ? Math.max(...parsed.map((x) => x.year)) : yearActual;

    const maxN = parsed
      .filter((x) => x.year === year)
      .reduce((acc, x) => Math.max(acc, x.n), 0);

    const nextN = String(maxN + 1).padStart(3, '0');
    return `MDP-${year}-${nextN}`;
  }


  private cargarAlumno(id: string): void {
    this.studentApi.getById(id).subscribe({
      next: (student) => {
        if (!student) {
          this.statusMessage.set({ type: 'error', text: 'Alumno no encontrado' });
          this.isLoading.set(false);
          return;
        }

        this.studentForm.patchValue(
          {
            legajo: (student as any).legajo ?? '',
            nombre: (student as any).nombre ?? '',
            apellido: (student as any).apellido ?? '',
            dni: (student as any).dni ?? '',
            email: (student as any).email ?? '',
            telefono: (student as any).telefono ?? '',
            condicion: (student as any).condicion ?? 'regular',
            fechaIngreso: (student as any).fechaIngreso ?? (student as any).fechaingreso ?? '',
          },
          { emitEvent: false }
        );

        this.studentForm.enable({ emitEvent: false });
        this.isLoading.set(false);
      },
      error: () => {
        this.statusMessage.set({ type: 'error', text: 'Error al buscar el alumno' });
        this.isLoading.set(false);
      },
    });
  }

  onSubmit(): void {
    this.guardar();
  }

  guardar(): void {
    this.statusMessage.set(null);

    if (this.studentForm.invalid) {
      this.statusMessage.set({ type: 'error', text: 'Revisá los campos obligatorios' });
      return;
    }

    const payload = this.studentForm.getRawValue();

    if (this.editMode()) {
      const id = this.studentId();
      if (!id) {
        this.statusMessage.set({ type: 'error', text: 'ID inválido para editar' });
        return;
      }

      this.studentApi.update(id, payload as Partial<Student>).subscribe({
        next: () => {
          this.statusMessage.set({ type: 'success', text: 'Alumno actualizado correctamente' });
        },
        error: () => {
          this.statusMessage.set({ type: 'error', text: 'Error al actualizar el alumno' });
        },
      });

      return;
    }

    const newId =
      globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID().slice(0, 4) : Date.now().toString();

    const student: Student = {
      ...(payload as any),
      id: newId as any,
    } as any;

    this.studentApi.create(student).subscribe({
      next: () => {
        this.statusMessage.set({ type: 'success', text: 'Alumno creado correctamente' });

        this.inicializarAlta();
      },
      error: () => {
        this.statusMessage.set({ type: 'error', text: 'Error al crear el alumno' });
      },
    });
  }
}
