import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { FormularioExamenComponent } from '../../admin/formularioNotas/formulario-examen/formulario-examen.component';

@Component({
  selector: 'app-carga-notas-examen-profesor',
  standalone: true,
  imports: [CommonModule, FormularioExamenComponent],
  template: `
    <app-formulario-examen [studentId]="studentId"></app-formulario-examen>
  `,
})
export class CargaNotasExamenProfesorComponent {
  private route = inject(ActivatedRoute);

  studentId = Number(this.route.snapshot.paramMap.get('id'));
}
