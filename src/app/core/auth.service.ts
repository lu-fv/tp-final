import { inject, Injectable, signal } from '@angular/core';
import { SessionUser, Rol } from './models';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<SessionUser | null>(null);
  private router = inject(Router);

  constructor() {
    const raw = localStorage.getItem('auth:user');
    if (raw) this._user.set(JSON.parse(raw));
  }

  user(): SessionUser | null {
    return this._user();
  }

  role(): Rol | null {
    return this.user()?.role ?? null;
  }

  isLogged(): boolean {
    return !!this.user();
  }

  isAdmin(): boolean {
    return this.role() === 'admin';
  }

  hasRole(role: Rol): boolean {
    return this.role() === role;
  }

  private safeNumber(value: any): number | null {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  async login(username: string, password: string): Promise<boolean> {
    const p = encodeURIComponent(password);

    try {
      // USERS (alumnos)
      {
        const res = await fetch(
          `http://localhost:3000/users?username=${username}&password=${p}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const users = await res.json();

        if (Array.isArray(users) && users.length === 1) {
          const u = users[0];
          const su: SessionUser = {
            id: Number(u.id),
            username: u.username,
            nombre: u.username,
            role: 'alumno',
            token: 'tok',
            studentId: this.safeNumber(u.studentId), 
          };
          this.persist(su);
          return true;
        }
      }

      {
        const res = await fetch(
          `http://localhost:3000/admins?username=${username}&password=${p}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const admins = await res.json();

        if (Array.isArray(admins) && admins.length === 1) {
          const ad = admins[0];
          const su: SessionUser = {
            id: Number(ad.id),
            username: ad.username,
            nombre: ad.nombre ?? 'Admin',
            role: 'admin',
            token: 'tok',
            studentId: null,
          };
          this.persist(su);
          return true;
        }
      }

      {
        const res = await fetch(
          `http://localhost:3000/profesores?username=${username}&password=${p}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const profesores = await res.json();

        if (Array.isArray(profesores) && profesores.length === 1) {
          const pr = profesores[0];
          const su: SessionUser = {
            id: Number(pr.id),
            username: pr.username,
            nombre: pr.nombre ?? 'Profesor',
            role: 'profesor',
            token: 'tok',
            studentId: null,
          };
          this.persist(su);
          return true;
        }
      }

      return false;
    } catch (err) {
      console.error('Error en login:', err);
      return false;
    }
  }

  logout() {
    this._user.set(null);
    localStorage.removeItem('auth:user');
    this.router.navigate(['/login']).then(() => window.location.reload());
  }

  private persist(u: SessionUser) {
    this._user.set(u);
    localStorage.setItem('auth:user', JSON.stringify(u));
  }
}
