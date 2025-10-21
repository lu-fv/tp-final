import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Rol = 'alumno' | 'admin' | null;

@Injectable({ providedIn: 'root' })
export class MenuService {
  private _rol$ = new BehaviorSubject<Rol>(null);

  /** Guarda el rol actual (alumno/admin) */
  setRole(rol: Rol) {
    this._rol$.next(rol);
  }

  /** Devuelve el valor actual (sincrónico) */
  getRole(): Rol {
    return this._rol$.value;
  }

  /** Observable si en algún momento querés reaccionar a cambios */
  get role$() {
    return this._rol$.asObservable();
  }

  /** Helpers para plantillas */
  isAlumno() { return this._rol$.value === 'alumno'; }
  isAdmin()  { return this._rol$.value === 'admin'; }
  clear()    { this._rol$.next(null); }
}
