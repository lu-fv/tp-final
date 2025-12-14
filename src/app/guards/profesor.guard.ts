// src/app/guards/profesor.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';  

export const profesorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const role = auth.role();

  if (role === 'profesor') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
