import { Injectable, signal } from '@angular/core';
import type { Rol } from '../core/models';

@Injectable({ providedIn: 'root' })
export class MenuService {
  // rol actual (reactivo)
  private _role = signal<Rol | null>(null);

  // leer
  role() { return this._role(); }

  // escribir
  setRole(r: Rol) { this._role.set(r); }

  // helpers para el menú
  isAlumno() { return this._role() === 'alumno'; }
  isAdmin()  { return this._role() === 'admin'; }

  // limpiar (logout, etc.)
  clear() {
    this._role.set(null);
    localStorage.removeItem('auth:user');
  }
}
