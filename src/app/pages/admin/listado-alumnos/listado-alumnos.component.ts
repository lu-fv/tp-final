import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';

import { StudentApiService } from '../../../services/student-api.service';
import { Student } from '../../../core/models';

@Component({
  selector: 'app-listado-alumnos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './listado-alumnos.component.html',
  styleUrl: './listado-alumnos.component.css',
})
export class ListadoAlumnosComponent {
  private studentApi = inject(StudentApiService);
  private router = inject(Router);

  protected alumnos = signal<Student[]>([]);
  protected query = signal<string>('');

  private norm(v: string): string {
    return (v ?? '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\./g, '');
  }

  protected alumnosFiltrados = computed(() => {
    const q = this.norm(this.query());
    if (!q) return this.alumnos();

    return this.alumnos().filter((a) => {
      const legajo = this.norm((a as any).legajo ?? '');
      const nombre = this.norm((a as any).nombre ?? '');
      const apellido = this.norm((a as any).apellido ?? '');
      const dni = this.norm(String((a as any).dni ?? ''));

      return (
        legajo.includes(q) ||
        nombre.includes(q) ||
        apellido.includes(q) ||
        `${apellido} ${nombre}`.includes(q) ||
        dni.includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.cargarAlumnos();
  }

  onBuscar(valor: string) {
    this.query.set(valor);
  }

  limpiar() {
    this.query.set('');
  }

  editarAlumno(alumno: Student) {
    this.router.navigate(['/dashboard/admin/alta'], {
      queryParams: { id: String((alumno as any).id) },
    });
  }

  eliminarAlumno(alumno: Student) {
    const ok = confirm(
      `¿Seguro que querés eliminar al alumno ${(alumno as any).nombre} ${(alumno as any).apellido}?`
    );
    if (!ok) return;

    const studentId = String((alumno as any).id ?? '').trim();
    const legajo = String((alumno as any).legajo ?? '').trim();

    if (!studentId) {
      alert('No se pudo eliminar: id inválido.');
      return;
    }

    // 1) borrar user(s) vinculados
    // 2) borrar alumno
    this.studentApi
      .deleteUsersForStudent(studentId, legajo)
      .pipe(switchMap(() => this.studentApi.delete(studentId)))
      .subscribe({
        next: () => this.cargarAlumnos(),
        error: (err) => {
          console.error('Error al eliminar alumno', err);
          alert('No se pudo eliminar al alumno (404/Backend). Revisá el id en db.json.');
        },
      });
  }

  private cargarAlumnos(): void {
    this.studentApi.getAll().subscribe((students) => this.alumnos.set(students ?? []));
  }
}
