import { Injectable, signal } from '@angular/core';
import { SessionUser, Rol } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<SessionUser | null>(null);

  constructor() {
    const raw = localStorage.getItem('auth:user');
    if (raw) this._user.set(JSON.parse(raw));
  }

  /** Estado de sesión */
  user() { return this._user(); }
  rol(): Rol | null { return this._user()?.rol ?? null; }
  isLogged() { return !!this._user(); }
  isAdmin() { return this.rol() === 'admin'; }

  /** Login que acepta alumno o admin */
  async login(username: string, password: string): Promise<boolean> {
    const u = encodeURIComponent(username);
    const p = encodeURIComponent(password);

    try {
      // 1) Buscar alumno
      {
        const res = await fetch(`http://localhost:3000/users?username=${u}&password=${p}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const students = await res.json();
        if (Array.isArray(students) && students.length === 1) {
          const s = students[0];
          const su: SessionUser = {
            id: Number(s.id),
            username,
            nombre: s.username ?? username,
            rol: 'alumno',
            token: 'tok'
          };
          this.persist(su);
          return true;
        }
      }

      // 2) Buscar admin
      {
        const res = await fetch(`http://localhost:3000/admins?username=${u}&password=${p}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const admins = await res.json();
        if (Array.isArray(admins) && admins.length === 1) {
          const a = admins[0];
          const su: SessionUser = {
            id: Number(a.id),
            username,
            nombre: a.nombre ?? username,
            rol: 'admin',
            token: 'tok'
          };
          this.persist(su);
          return true;
        }
      }

      // Nadie matcheó
      return false;
    } catch {
      return false;
    }
  }

  logout() {
    this._user.set(null);
    localStorage.removeItem('auth:user');
  }

  private persist(u: SessionUser) {
    this._user.set(u);
    localStorage.setItem('auth:user', JSON.stringify(u));
  }
}
