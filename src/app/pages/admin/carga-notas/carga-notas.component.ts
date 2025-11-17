import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseGrade } from '../../../core/models';
import { ActivatedRoute } from '@angular/router';
import { CargaNotasService } from '../../../services/carga-notas.service';
import { FormularioCursadaComponent } from '../formularioNotas/formulario-cursada/formulario-cursada.component';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-carga-notas',
  standalone: true,
  imports: [FormularioCursadaComponent,
     CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
  ],
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
  selectedForm = signal<'opcion1' | 'opcion2' |'opcion3' >('opcion1');

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

   onFormSelectionChange(event: any): void {
    const value = event.value;
    if (value === 'option2') {
      this.selectedForm.set('opcion2');
    } else if (value === 'option3') {
      this.selectedForm.set('opcion3');
    } else {
      this.selectedForm.set('opcion1');
    }
  }
}
