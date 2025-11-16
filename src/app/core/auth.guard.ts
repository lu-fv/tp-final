import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from './models';
import { of } from 'rxjs';
//AuthGuard valida que el user este logueado
// y devuleve true, en el caso que no retorna false y te redirige al login
//Sierve para restringir el acceso a los componentes cuando no estas logueado
export const AuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLogged()) {
    return true;
  }
  router.navigateByUrl('/login');
  return false;
};
///HasRole verifica que el user tenga el rol adecuado en el component
export const HasRole = (role: Rol): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isLogged() && auth.hasRole(role)) {
    
      return of(true);
    }
      auth.logout();
    return of(false);
  };
};
