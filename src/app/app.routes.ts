import { Routes } from '@angular/router';
import { AuthGuard, HasRole } from './core/auth.guard';
//import { MenuAlumnoComponent } from './pages/alumno/menu-alumno/menu-alumno.component';

// Layout (admin)
import { MenuComponent } from './menu/menu.component';

// Admin pages
import { AddStudentComponent } from './pages/admin/add-student/add-student.component';


export const routes: Routes = [
  // Login (lazy)
  {
    path: '',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },

  // ===================== ÁREA AUTENTICADA – ADMIN =====================
  {
    path: 'dashboard/admin',
    component: MenuComponent,            // layout admin existente
    canActivate: [AuthGuard, HasRole('admin')],
    children: [
      // Página por defecto en admin
      { path: '', component: AddStudentComponent },
      // Alta de alumno (alias explícito)
      { path: 'alta-alumno', component: AddStudentComponent },
      // (Acá pueden sumar más páginas de admin cuando existan)
    ],
  },

  // ===================== ÁREA AUTENTICADA – ALUMNO =====================
 {
  path: 'dashboard/student',
  canActivate: [AuthGuard, HasRole('alumno')],
  loadComponent: () =>
    import('./pages/alumno/menu-alumno/menu-alumno.component')
      .then(m => m.MenuAlumnoComponent),     // <— layout (standalone) con <router-outlet>
  children: [
    {
      path: '',
      loadComponent: () =>
        import('./pages/alumno/inicio-alumno/inicio-alumno.component')
          .then(c => c.InicioAlumnoComponent),
    },
    {
      path: 'deuda',
      loadComponent: () =>
        import('./pages/deuda/deuda.component')
          .then(c => c.DeudaComponent),
    },
    {
      path: 'inscripciones',
      loadComponent: () => import('./pages/alumno/inscripciones-cursadas/inscripciones-cursadas.component')
        .then(c => c.InscripcionesCursadasComponent),
    },
    {
      path: 'examenes',
      loadComponent: () => import('./pages/alumno/inscripciones-examen/inscripciones-examen.component')
        .then(c => c.InscripcionesExamenComponent),
    },
    {
  path: 'notas',
  loadComponent: () =>
    import('./pages/alumno/notas/notas.component')
      .then(c => c.NotasComponent),
    }
    
  ],
}
]
