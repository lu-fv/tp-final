import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import type { Profesor } from '../core/models';

@Injectable({ providedIn: 'root' })
export class ProfesorApiService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:3000';
  private resource = 'profesores';

  getAll(): Observable<Profesor[]> {
    return this.http
      .get<Profesor[]>(`${this.baseUrl}/${this.resource}`)
      .pipe(map((res) => res ?? []));
  }

  getById(id: number | string): Observable<Profesor | null> {
    if (id === null || id === undefined || id === '') return of(null);

    return this.http
      .get<Profesor>(`${this.baseUrl}/${this.resource}/${id}`)
      .pipe(map((p) => p ?? null));
  }

  getByUsername(username: string): Observable<Profesor | null> {
    const u = (username ?? '').trim();
    if (!u) return of(null);

    return this.http
      .get<Profesor[]>(
        `${this.baseUrl}/${this.resource}?username=${encodeURIComponent(u)}`
      )
      .pipe(map((arr) => (Array.isArray(arr) && arr.length ? arr[0] : null)));
  }
}
