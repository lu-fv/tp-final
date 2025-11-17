import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CourseGrade } from '../../../core/models';
import { ActivatedRoute } from '@angular/router';
import { CargaNotasService } from '../../../services/carga-notas.service';
import { FormularioCursadaComponent } from '../formularioNotas/formulario-cursada/formulario-cursada.component';

@Component({
  selector: 'app-carga-notas',
  standalone: true,
  imports: [FormularioCursadaComponent],
  templateUrl: './carga-notas.component.html',
  styleUrl: './carga-notas.component.css',
  providers: [CargaNotasService],
})
export class CargaNotasComponent {
  private route = inject(ActivatedRoute);
 studentId = signal<number | null>(null);

  statusMessage = signal<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  ngOnInit(): void {
    const studentId = this.route.snapshot.paramMap.get('id');
    if (studentId) {
      this.studentId.set(Number(studentId));
    } else {
      this.statusMessage.set({
        type: 'error',
        text: 'ID de estudiante no proporcionado en la ruta.',
      });
    }
  }
}
