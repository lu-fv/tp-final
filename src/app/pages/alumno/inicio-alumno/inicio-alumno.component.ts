import { Component, inject, signal, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/auth.service';
import { StudentApiService } from '../../../services/student-api.service';
import { Student } from '../../../core/models';

@Component({
  standalone: true,
  selector: 'app-inicio-alumno',
  imports: [NgIf],
  templateUrl: './inicio-alumno.component.html',
  styleUrls: ['./inicio-alumno.component.css'],
})
export class InicioAlumnoComponent {
  private auth = inject(AuthService);
  private students = inject(StudentApiService);

  alumno = signal<Student | null>(null);
  username = signal<string>('');  

  ngOnInit(): void {
    const u = this.auth.user();
    if (!u) return;

    this.username.set(u.username);

    if (u.studentId != null && typeof u.studentId === 'number') {
      this.students.getById(u.studentId).subscribe({
        next: (s) => this.alumno.set(s),
        error: () => this.alumno.set(null),
      });
    } else {
      this.alumno.set(null);
    }
  }
}
