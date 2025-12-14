import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

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

  protected alumnos = signal<Student[]>([]);
  protected query = signal<string>('');
  private router = inject(Router);

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
      const legajo = this.norm(a.legajo ?? '');
      const nombre = this.norm(a.nombre ?? '');
      const apellido = this.norm(a.apellido ?? '');
      const dni = this.norm(String(a.dni ?? ''));

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
    queryParams: { id: alumno.id }
    });
  }

  eliminarAlumno(alumno: Student) {
    const ok = confirm(
      `¿Seguro que querés eliminar al alumno ${alumno.nombre} ${alumno.apellido}?`
    );
    if (!ok) return;

    const id = String(alumno.id); 

    this.studentApi.delete(id).subscribe({
      next: () => this.cargarAlumnos(),
      error: (err) => console.error('Error al eliminar alumno', err),
    });
  }


  private cargarAlumnos(): void {
  this.studentApi.getAll().subscribe((students) => this.alumnos.set(students ?? []));
}




}
