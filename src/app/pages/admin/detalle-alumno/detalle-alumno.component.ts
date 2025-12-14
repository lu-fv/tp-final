import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { StudentApiService } from '../../../services/student-api.service';
import { Student } from '../../../core/models';

@Component({
  selector: 'app-detalle-alumno',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './detalle-alumno.component.html',
  styleUrl: './detalle-alumno.component.css',
})
export class DetalleAlumnoComponent {
  private studentApi = inject(StudentApiService);
  private route = inject(ActivatedRoute);

  alumno = signal<Student | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    if (!id) return;

    this.studentApi.getStudentById(id).subscribe({
      next: (student) => this.alumno.set(student),
      error: (err) => console.error('Error al cargar alumno', err),
    });
  }
}
