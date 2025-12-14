import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { FormularioCursadaComponent } from '../../admin/formularioNotas/formulario-cursada/formulario-cursada.component';

@Component({
  selector: 'app-carga-notas-cursada-profesor',
  standalone: true,
  imports: [CommonModule, FormularioCursadaComponent],
  templateUrl: './carga-notas-cursada-profesor.component.html',
})
export class CargaNotasCursadaProfesorComponent {
  private route = inject(ActivatedRoute);

  studentId = Number(this.route.snapshot.paramMap.get('id'));
}
