import { Routes } from '@angular/router';
import { MenuComponent } from './menu/menu.component';
import { DeudaComponent } from './pages/deuda/deuda.component';
import { AuthGuard } from './core/auth.guard';

export const routes: Routes = [
  // Login (lazy)
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },

  // Área autenticada (usa el layout del menú)
  {
    path: '',
    component: MenuComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'deuda', component: DeudaComponent },
      { path: '', pathMatch: 'full', redirectTo: 'deuda' },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
