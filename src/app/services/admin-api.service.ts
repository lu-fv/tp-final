import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Admin } from '../core/models';

@Injectable({
  providedIn: 'root',
})
export class AdminApiService {
  private http = inject(HttpClient);


  private baseUrl = 'http://localhost:3000';
  private resource = 'admins';

  getById(id: number): Observable<Admin | null> {
    return this.http
      .get<Admin>(`${this.baseUrl}/${this.resource}/${id}`)
      .pipe(map((s) => s ?? null));
  }
}
