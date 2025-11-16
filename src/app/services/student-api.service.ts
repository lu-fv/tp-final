import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Student } from '../core/models';
import { DatepickerDropdownPositionY } from '@angular/material/datepicker';

@Injectable({ providedIn: 'root' })
export class StudentApiService {
  private http = inject(HttpClient);

  // Ajustá si tu json-server está en otra URL/puerto
  private baseUrl = 'http://localhost:3000';
  private resource = 'students';

  getById(id: number): Observable<Student | null> {
    return this.http
      .get<Student>(`${this.baseUrl}/${this.resource}/${id}`)
      .pipe(map((s) => s ?? null));
  }
  getLastStudent(): Observable<Student | null> {
    return this.http
      .get<Array<Student>>(`${this.baseUrl}/${this.resource}`)
      .pipe(
        map((s) => {
          return s[s.length - 1];
        })
      );
  }
  create(
    id:string,
    studentId: string,
    firstName: string,
    lastName: string,
    nationalId: string,
    email: string,
    phone: string,
    status: string,
    admissionDate: string
  ): Observable<boolean> {
    return this.http
      .post<boolean>(`${this.baseUrl}/${this.resource}`, {
        id: id,
        legajo: studentId,
        nombre: firstName,
        apellido: lastName,
        dni: nationalId,
        email: email,
        telefono: phone,
        condicion: status,
        fechaIngreso: admissionDate,
      })
      .pipe(
        map((result) => {
          return result ? true : false;
        })
      );
  }
  
  getAll(): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.baseUrl}/${this.resource}`).pipe(
      map((students) => students || [])
    );
  }
}
