import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from './models';
import { of } from 'rxjs';
export const AuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLogged()) {
    return true;
  }
  router.navigateByUrl('/login');
  return false;
};
export const HasRole = (role: Rol): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLogged() && auth.hasRole(role)) {
      return of(true);
    }

    auth.logout();
    router.navigateByUrl('/login');
    return of(false);
  };
};
