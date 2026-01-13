import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
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
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^\d{3,4}-\d{3}-\d{4}$/), // 223-555-0000 / 0223-555-0000
      ],
    }),
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

    // al cambiar DNI / Email, limpiamos error duplicado para que vuelva a validar visualmente
    this.studentForm.get('dni')?.valueChanges.subscribe(() => {
      const c = this.studentForm.get('dni');
      if (!c) return;
      const errs = { ...(c.errors ?? {}) };
      delete errs['dniDuplicado'];
      c.setErrors(Object.keys(errs).length ? errs : null);
    });

    this.studentForm.get('email')?.valueChanges.subscribe(() => {
      const c = this.studentForm.get('email');
      if (!c) return;
      const errs = { ...(c.errors ?? {}) };
      delete errs['emailDuplicado'];
      c.setErrors(Object.keys(errs).length ? errs : null);
    });

    if (edit) {
      this.studentForm.disable({ emitEvent: false });
      this.cargarAlumno(id);
      return;
    }

    this.isLoading.set(false);
    this.studentForm.enable({ emitEvent: false });

    this.generarLegajoAutomatico();
  }

  private cargarAlumno(id: string): void {
    this.studentApi.getById(id).subscribe({
      next: (student) => {
        if (!student) {
          this.statusMessage.set({ type: 'error', text: 'Alumno no encontrado' });
          this.isLoading.set(false);
          return;
        }

        this.studentForm.patchValue({
          legajo: (student as any).legajo ?? '',
          nombre: (student as any).nombre ?? '',
          apellido: (student as any).apellido ?? '',
          dni: (student as any).dni ?? '',
          email: (student as any).email ?? '',
          telefono: (student as any).telefono ?? '',
          condicion: (student as any).condicion ?? 'regular',
          fechaIngreso: (student as any).fechaIngreso ?? (student as any).fechaingreso ?? '',
        });

        this.studentForm.enable({ emitEvent: false });
        // legajo no editable
        this.studentForm.get('legajo')?.disable({ emitEvent: false });

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
      this.studentForm.markAllAsTouched();
      this.statusMessage.set({ type: 'error', text: 'Revisá los campos obligatorios' });
      return;
    }

    const payload = this.studentForm.getRawValue();

    // -------------------------
    // EDITAR
    // -------------------------
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

    // -------------------------
    // CREAR
    // -------------------------
    const dniNorm = this.normalizeDni(payload.dni);
    const emailNorm = this.normalizeEmail(payload.email);

    this.studentApi
      .getAll()
      .pipe(
        map((students) => (students ?? []) as any[]),
        map((students) => {
          const dniDuplicado = students.some((s) => this.normalizeDni(s?.dni) === dniNorm);
          const emailDuplicado = students.some(
            (s) => this.normalizeEmail(s?.email) === emailNorm
          );

          // id nuevo (string) - para mantener consistencia con json-server
          const maxId = students
            .map((s) => parseInt(String(s?.id ?? '0'), 10))
            .filter((n) => Number.isFinite(n))
            .reduce((acc, n) => Math.max(acc, n), 0);

          const nextIdStr = String(maxId + 1);

          return { dniDuplicado, emailDuplicado, nextIdStr };
        })
      )
      .subscribe({
        next: ({ dniDuplicado, emailDuplicado, nextIdStr }) => {
          const dniCtrl = this.studentForm.get('dni');
          const emailCtrl = this.studentForm.get('email');

          let hasDup = false;

          if (dniDuplicado && dniCtrl) {
            dniCtrl.setErrors({ ...(dniCtrl.errors ?? {}), dniDuplicado: true });
            dniCtrl.markAsTouched();
            hasDup = true;
          }

          if (emailDuplicado && emailCtrl) {
            emailCtrl.setErrors({ ...(emailCtrl.errors ?? {}), emailDuplicado: true });
            emailCtrl.markAsTouched();
            hasDup = true;
          }

          if (hasDup) {
            this.statusMessage.set({
              type: 'error',
              text: 'No se pudo crear: DNI y/o Email ya existen.',
            });
            // NO resetea el formulario (como lo querías)
            return;
          }

          const student: Student = {
            ...(payload as any),
            id: nextIdStr as any, // <- string SIEMPRE
          } as any;

          this.studentApi.create(student).subscribe({
            next: (created) => {
              const createdId = String((created as any)?.id ?? (student as any)?.id ?? '').trim();
              const legajo = String((created as any)?.legajo ?? (payload as any)?.legajo ?? '')
                .trim();

              if (!createdId || !legajo) {
                this.statusMessage.set({
                  type: 'success',
                  text: 'Alumno creado correctamente (sin usuario por datos incompletos).',
                });
                return;
              }

              // crear usuario alumno (username=legajo, pass=1234) si no existe
              this.studentApi.getUserByUsername(legajo).subscribe({
                next: (exists) => {
                  if (exists) {
                    this.statusMessage.set({
                      type: 'success',
                      text: 'Alumno creado correctamente (usuario ya existía para ese legajo).',
                    });
                  } else {
                    const userId = (globalThis.crypto?.randomUUID
                      ? globalThis.crypto.randomUUID().slice(0, 8)
                      : Date.now().toString()
                    ).toString();

                    this.studentApi
                      .createUser({
                        id: userId,
                        username: legajo,
                        password: '1234',
                        role: 'alumno',
                        studentId: createdId, // <- STRING, NUNCA null
                      })
                      .subscribe({
                        next: () => {
                          this.statusMessage.set({
                            type: 'success',
                            text: 'Alumno creado y usuario generado (clave 1234).',
                          });
                        },
                        error: () => {
                          this.statusMessage.set({
                            type: 'error',
                            text: 'Alumno creado, pero falló la creación del usuario.',
                          });
                        },
                      });
                  }

                  // recién acá reseteamos, SOLO en éxito real de alta (no en duplicados)
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
                  this.generarLegajoAutomatico();
                },
                error: () => {
                  this.statusMessage.set({
                    type: 'error',
                    text: 'Alumno creado, pero no se pudo validar/crear el usuario.',
                  });
                },
              });
            },
            error: () => {
              this.statusMessage.set({ type: 'error', text: 'Error al crear el alumno' });
            },
          });
        },
        error: () => {
          this.statusMessage.set({
            type: 'error',
            text: 'No se pudo validar unicidad (error de conexión).',
          });
        },
      });
  }

  private generarLegajoAutomatico(): void {
    const legajoCtrl = this.studentForm.get('legajo');
    if (!legajoCtrl) return;

    legajoCtrl.enable({ emitEvent: false });

    this.studentApi.getAll().subscribe({
      next: (students) => {
        const nextLegajo = this.buildNextLegajo(students ?? []);
        legajoCtrl.setValue(nextLegajo, { emitEvent: false });
        legajoCtrl.disable({ emitEvent: false });
      },
      error: () => {
        legajoCtrl.setValue('MDP-2020-001', { emitEvent: false });
        legajoCtrl.disable({ emitEvent: false });
      },
    });
  }

  private buildNextLegajo(students: Student[]): string {
    const re = /^([A-Z]{2,})-(\d{4})-(\d{3,})$/;

    const parsed = students
      .map((s: any) => String(s?.legajo ?? '').trim())
      .map((l) => {
        const m = l.match(re);
        if (!m) return null;
        return { sede: m[1], year: Number(m[2]), seq: Number(m[3]) };
      })
      .filter(Boolean) as Array<{ sede: string; year: number; seq: number }>;

    const yearCounts = new Map<number, number>();
    for (const p of parsed) yearCounts.set(p.year, (yearCounts.get(p.year) ?? 0) + 1);

    const mostCommonYear =
      [...yearCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? new Date().getFullYear();

    const sedeCounts = new Map<string, number>();
    for (const p of parsed) sedeCounts.set(p.sede, (sedeCounts.get(p.sede) ?? 0) + 1);

    const mostCommonSede =
      [...sedeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'MDP';

    const maxSeq = parsed
      .filter((p) => p.sede === mostCommonSede && p.year === mostCommonYear)
      .reduce((acc, p) => Math.max(acc, p.seq), 0);

    const nextSeq = maxSeq + 1;

    return `${mostCommonSede}-${mostCommonYear}-${String(nextSeq).padStart(3, '0')}`;
  }

  private normalizeDni(dni: any): string {
    return String(dni ?? '').replace(/\D/g, '');
  }

  private normalizeEmail(email: any): string {
    return String(email ?? '').trim().toLowerCase();
  }
}
