import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth.service';
import { ProfesorApiService } from '../../../services/profesor-api.service';
import type { Profesor } from '../../../core/models';

@Component({
  selector: 'app-inicio-profesor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-profesor.component.html',
  styleUrl: './inicio-profesor.component.css',
})
export class InicioProfesorComponent implements OnInit {
  private auth = inject(AuthService);
  private profesorApi = inject(ProfesorApiService);

  profesor = signal<Profesor | null>(null);

  ngOnInit(): void {
    const user = this.auth.user(); 
    if (!user) return;

    this.profesorApi.getById(user.id).subscribe((p) => {
      this.profesor.set(p);
    });
  }
}
