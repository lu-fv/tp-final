import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Student } from '../core/models';

@Injectable({ providedIn: 'root' })
export class StudentApiService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:3000';
  private resource = 'students';

  getAll(): Observable<Student[]> {
    return this.http
      .get<Student[]>(`${this.baseUrl}/${this.resource}`)
      .pipe(
        map((res) => res ?? []),
        catchError(() => of([]))
      );
  }

  /** ✅ Canonical: id como string (funciona con "101" y con 1765...) */
  getById(id: number | string): Observable<Student | null> {
    const idStr = String(id ?? '').trim();
    if (!idStr) return of(null);

    return this.http
      .get<Student>(`${this.baseUrl}/${this.resource}/${encodeURIComponent(idStr)}`)
      .pipe(catchError(() => of(null)));
  }

  /** ✅ Alias para no romper componentes viejos */
  getStudentById(id: number | string): Observable<Student | null> {
    return this.getById(id);
  }

  create(student: Student): Observable<Student> {
    return this.http.post<Student>(`${this.baseUrl}/${this.resource}`, student);
  }

  /** ✅ PATCH sin Number() */
  update(id: number | string, patch: Partial<Student>): Observable<Student> {
    const idStr = String(id ?? '').trim();
    return this.http.patch<Student>(
      `${this.baseUrl}/${this.resource}/${encodeURIComponent(idStr)}`,
      patch
    );
  }

  /** ✅ DELETE sin Number() */
  delete(id: number | string): Observable<void> {
    const idStr = String(id ?? '').trim();
    return this.http.delete<void>(`${this.baseUrl}/${this.resource}/${encodeURIComponent(idStr)}`);
  }

  // Helper opcional
  getByDni(dni: string): Observable<Student | null> {
    const d = (dni ?? '').replace(/\D/g, '');
    if (!d) return of(null);

    return this.getAll().pipe(
      map(
        (students) =>
          students.find(
            (s: any) => String(s?.dni ?? '').replace(/\D/g, '') === d
          ) ?? null
      )
    );
  }
}
