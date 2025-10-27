import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Student } from '../core/models';

@Injectable({ providedIn: 'root' })
export class StudentApiService {
  private http = inject(HttpClient);

  // Ajustá si tu json-server está en otra URL/puerto
  private baseUrl = 'http://localhost:3000';
  private resource = 'students';

  getById(id: number): Observable<Student | null> {
    return this.http.get<Student>(`${this.baseUrl}/${this.resource}/${id}`)
      .pipe(map(s => s ?? null));
  }
}
