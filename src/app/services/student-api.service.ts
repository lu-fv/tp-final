import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { catchError, map, concatMap, last, switchMap } from 'rxjs/operators';
import { Student } from '../core/models';

export type AppUser = {
  id: string;
  username: string;
  password: string;
  role: 'alumno' | 'admin' | 'profesor';
  studentId?: string; // <- IMPORTANTE: solo string
};

@Injectable({ providedIn: 'root' })
export class StudentApiService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:3000';
  private resource = 'students';
  private usersResource = 'users';

  // -------------------------
  // STUDENTS
  // -------------------------
  getAll(): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.baseUrl}/${this.resource}`).pipe(
      map((res) => res ?? []),
      catchError(() => of([]))
    );
  }

  getById(id: number | string): Observable<Student | null> {
    const idStr = String(id ?? '').trim();
    if (!idStr) return of(null);

    return this.http
      .get<Student>(`${this.baseUrl}/${this.resource}/${encodeURIComponent(idStr)}`)
      .pipe(catchError(() => of(null)));
  }

  getStudentById(id: number | string): Observable<Student | null> {
    return this.getById(id);
  }

  create(student: Student): Observable<Student> {
    return this.http.post<Student>(`${this.baseUrl}/${this.resource}`, student);
  }

  update(id: number | string, patch: Partial<Student>): Observable<Student> {
    const idStr = String(id ?? '').trim();
    return this.http.patch<Student>(
      `${this.baseUrl}/${this.resource}/${encodeURIComponent(idStr)}`,
      patch
    );
  }

  delete(id: number | string): Observable<void> {
    const idStr = String(id ?? '').trim();
    return this.http.delete<void>(`${this.baseUrl}/${this.resource}/${encodeURIComponent(idStr)}`);
  }

  getByDni(dni: string): Observable<Student | null> {
    const d = (dni ?? '').replace(/\D/g, '');
    if (!d) return of(null);

    return this.getAll().pipe(
      map(
        (students) =>
          students.find((s: any) => String(s?.dni ?? '').replace(/\D/g, '') === d) ?? null
      )
    );
  }

  // -------------------------
  // USERS
  // -------------------------
  getAllUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(`${this.baseUrl}/${this.usersResource}`).pipe(
      map((res) => res ?? []),
      catchError(() => of([]))
    );
  }

  getUserByUsername(username: string): Observable<AppUser | null> {
    const u = String(username ?? '').trim();
    if (!u) return of(null);

    return this.http
      .get<AppUser[]>(`${this.baseUrl}/${this.usersResource}?username=${encodeURIComponent(u)}`)
      .pipe(
        map((arr) => (arr?.[0] ? arr[0] : null)),
        catchError(() => of(null))
      );
  }

  /** Busca users por studentId (string) */
  getUsersByStudentId(studentId: string): Observable<AppUser[]> {
    const sid = String(studentId ?? '').trim();
    if (!sid) return of([]);

    return this.http
      .get<AppUser[]>(`${this.baseUrl}/${this.usersResource}?studentId=${encodeURIComponent(sid)}`)
      .pipe(
        map((res) => res ?? []),
        catchError(() => of([]))
      );
  }

  createUser(user: AppUser): Observable<AppUser> {
    // forzamos studentId string si viene
    const payload: AppUser = {
      ...user,
      studentId: user.studentId != null ? String(user.studentId).trim() : undefined,
    };
    return this.http.post<AppUser>(`${this.baseUrl}/${this.usersResource}`, payload);
  }

  deleteUser(userId: string): Observable<void> {
    const idStr = String(userId ?? '').trim();
    if (!idStr) return of(void 0);
    return this.http
      .delete<void>(`${this.baseUrl}/${this.usersResource}/${encodeURIComponent(idStr)}`)
      .pipe(catchError(() => of(void 0)));
  }

  /**
   * Elimina users vinculados a un alumno.
   * - Por studentId (string)
   * - Y además por username=legajo (por si quedó user “huérfano”)
   */
  deleteUsersForStudent(studentId: string, legajo: string): Observable<void> {
    const sid = String(studentId ?? '').trim();
    const leg = String(legajo ?? '').trim();

    return this.getAllUsers().pipe(
      map((users) => {
        const vinculados = (users ?? []).filter((u) => {
          const uSid = u?.studentId != null ? String(u.studentId).trim() : '';
          const uUser = String(u?.username ?? '').trim();
          return (sid && uSid === sid) || (leg && uUser === leg);
        });
        return vinculados;
      }),
      switchMap((vinculados) => {
        if (!vinculados.length) return of(void 0);

        return from(vinculados).pipe(
          concatMap((u) => this.deleteUser(String(u.id))),
          last(undefined, void 0),
          map(() => void 0),
          catchError(() => of(void 0))
        );
      }),
      catchError(() => of(void 0))
    );
  }
}
