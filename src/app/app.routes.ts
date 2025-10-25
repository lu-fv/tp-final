import { Routes } from '@angular/router';
import { MenuComponent } from './menu/menu.component';
import { DeudaComponent } from './pages/deuda/deuda.component';
import { AuthGuard } from './core/auth.guard';
import { AddStudentComponent } from './pages/admin/add-student/add-student.component';

export const routes: Routes = [
  // Login (lazy)
  {
    path: '',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },

  // Área autenticada (usa el layout del menú)
  {
    path: 'dashboard/admin',
    component: MenuComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: AddStudentComponent },
      { path: 'alta-alumno', component: AddStudentComponent },
    ],
  },
  {
    path: 'dashboard/student',
    component: MenuComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DeudaComponent },
      { path: 'deuda', component: DeudaComponent },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
