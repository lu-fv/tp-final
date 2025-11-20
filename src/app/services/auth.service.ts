import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, mergeMap, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    const params = new HttpParams().set('username', username).set('password', password);


    return this.http.get<any[]>(`${this.api}/users`, { params }).pipe(
      mergeMap(users => {
        if (Array.isArray(users) && users.length) return of(users);
        return this.http.get<any[]>(`${this.api}/admins`, { params });
      }),
      map(res => res) 
    );
  }
}
