import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { AuthService } from '../../../core/auth.service';
import { StudentApiService } from '../../../services/student-api.service';
import { Student } from '../../../core/models';

@Component({
  selector: 'app-menu-profesor',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
  ],
  templateUrl: './menu-profesor.component.html',
  styleUrl: './menu-profesor.component.css',
})
export class MenuProfesorComponent {
  private auth = inject(AuthService);
  private studentsApi = inject(StudentApiService);

  alumnoCtrl = new FormControl<string | Student>('');

  selectedStudentId: number | null = null;

  students: Student[] = [];

  filteredStudents$: Observable<Student[]> = this.alumnoCtrl.valueChanges.pipe(
    startWith(''),
    map((value) => (typeof value === 'string' ? value : this.displayStudent(value))),
    map((query) => this.filterStudents(query))
  );

  constructor() {
    this.studentsApi.getAll().subscribe({
      next: (list) => (this.students = list ?? []),
      error: () => (this.students = []),
    });
  }

  logout(): void {
    this.auth.logout();
  }

  displayStudent = (s: Student | null): string => {
    if (!s) return '';
    const legajo = this.legajoOf(s);
    return `${legajo} - ${s.apellido}, ${s.nombre}`;
  };

  onStudentSelected(s: Student) {
    this.selectedStudentId = Number((s as any).id);
  }

  private filterStudents(raw: string): Student[] {
    const q = this.normalize(raw);
    if (!q) return this.students;

    return this.students.filter((s) => {
      const legajo = this.normalize(this.legajoOf(s));
      const dni = this.normalize(this.dniOf(s));
      const apellido = this.normalize(s.apellido);
      const nombre = this.normalize(s.nombre);
      const full = this.normalize(`${s.apellido} ${s.nombre}`);

      return (
        legajo.includes(q) ||
        dni.includes(q) ||
        apellido.includes(q) ||
        nombre.includes(q) ||
        full.includes(q)
      );
    });
  }

  private normalize(v: any): string {
    return String(v ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  legajoOf(s: Student): string {
    return String((s as any).legajo ?? '');
  }

  dniOf(s: Student): string {
    return String((s as any).dni ?? '');
  }
}
