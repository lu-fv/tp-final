import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/auth.service';
import { StudentApiService } from '../../../services/student-api.service';
import { Student } from '../../../core/models';

@Component({
  selector: 'app-inicio-alumno',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-alumno.component.html',
  styleUrls: ['./inicio-alumno.component.css'],
})
export class InicioAlumnoComponent {
  private auth = inject(AuthService);
  private studentApi = inject(StudentApiService);

  usuario = signal(this.auth.user());
  alumno = signal<Student | null>(null);
  mensaje = signal<string>('');

  ngOnInit(): void {
    const u = this.usuario();

    if (!u) {
      this.mensaje.set('No hay usuario logueado.');
      return;
    }

    if (!u.studentId) {
      this.mensaje.set('El usuario no tiene studentId asociado. Verificá db.json.');
      return;
    }

    // IMPORTANTE: tu service se llama getStudentById (según tu captura)
    this.studentApi.getStudentById(u.studentId).subscribe((st) => {
      if (!st) {
        this.mensaje.set(
          'No se encontró un alumno asociado. Verificá users.studentId → students.id.'
        );
        return;
      }

      this.alumno.set(st);
      this.mensaje.set('');
    });
  }
}
