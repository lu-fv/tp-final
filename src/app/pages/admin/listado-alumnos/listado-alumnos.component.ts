import { Component, inject, signal } from '@angular/core';
import {DatePipe } from '@angular/common'; 
import { AdminApiService } from '../../../services/admin-api.service';
import { Student } from '../../../core/models';
import { StudentApiService } from '../../../services/student-api.service';


@Component({
  selector: 'app-listado-alumnos',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './listado-alumnos.component.html',
  styleUrl: './listado-alumnos.component.css',
  providers: [StudentApiService],
  

})
export class ListadoAlumnosComponent {

  private studentApi = inject (StudentApiService);
  protected alumnos = signal<Array<Student>>([]);
  ngOnInit(): void {
    this.studentApi.getAll().subscribe((students) => {
      this.alumnos.set(students);
    });
  }
}
