import { inject, Injectable, signal } from '@angular/core';
import { SessionUser, Rol } from './models';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<SessionUser | null>(null);
  private router = inject (Router)
  constructor() {
    const raw = localStorage.getItem('auth:user');
    if (raw) this._user.set(JSON.parse(raw));
  }

  /** Estado de sesión */
  user() { return this._user(); }
  role(): 'alumno'|'admin'|null { return this._user()?.role ?? null; }
  isLogged() { return !!this._user(); }
  isAdmin() { return this.role() === 'admin'; }

  /** Login que acepta alumno o admin */
  async login(username: string, password: string): Promise<boolean> {
  const u = encodeURIComponent(username);
  const p = encodeURIComponent(password);

  try {
    /** 1) Buscar alumno por username+password en /users */
    {
      const res = await fetch(`http://localhost:3000/users?username=${u}&password=${p}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const users = await res.json();

      if (Array.isArray(users) && users.length === 1) {
        const usr = users[0];
        const su: SessionUser = {
          id: Number(usr.id),
          username: usr.username,
          nombre: usr.username,
          role: 'alumno',
          token: 'tok',
          studentId: Number(usr.studentId)   // <--- CLAVE
        };
        this.persist(su);
        return true;
      }
    }

    /** 2) Buscar admin si no fue alumno */
    {
      const res = await fetch(`http://localhost:3000/admins?username=${u}&password=${p}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const admins = await res.json();

      if (Array.isArray(admins) && admins.length === 1) {
        const ad = admins[0];
        const su: SessionUser = {
          id: Number(ad.id),
          username: ad.username ?? 'admin',
          nombre: ad.nombre ?? 'Admin',
          role: 'admin',
          token: 'tok'
        };
        this.persist(su);
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

  logout() {
    this._user.set(null);
    localStorage.removeItem('auth:user');
    this.router.navigate(['/login']).then(() => {
      window.location.reload(); // fuerza recarga luego de navegar
    });
  }

  private persist(u: SessionUser) {
    this._user.set(u);
    localStorage.setItem('auth:user', JSON.stringify(u));
  }
}
