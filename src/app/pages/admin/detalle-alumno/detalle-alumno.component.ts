import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { StudentApiService } from '../../../services/student-api.service';
import { Student } from '../../../core/models';
import { ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-detalle-alumno',
  standalone: true,
  imports: [NgIf,RouterLink],
  templateUrl: './detalle-alumno.component.html',
  styleUrl: './detalle-alumno.component.css',
})
export class DetalleAlumnoComponent {
  private students = inject(StudentApiService);
  private route = inject(ActivatedRoute);

  alumno = signal<Student | null>(null);

  ngOnInit(): void {
    const userId = Number(this.route.snapshot.paramMap.get('id'));

    if (!userId) return;

    this.students.getStudentById(userId).subscribe({
      next: (student) => {
        this.alumno.set(student);
      },
      error: (err) => {
        console.error('Error fetching student details:', err);
      },
    });
  }
}
