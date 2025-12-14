import { Routes } from '@angular/router';
import { AuthGuard, HasRole } from './core/auth.guard';

// Admin pages
import { AddStudentComponent } from './pages/admin/add-student/add-student.component';

export const routes: Routes = [

  // LOGIN
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

  // ===================== ADMIN =====================
  {
    path: 'dashboard/admin',
    canActivate: [AuthGuard, HasRole('admin')],
    loadComponent: () =>
      import('./pages/admin/menu-admin/menu-admin.component')
        .then(m => m.MenuAdminComponent),
    children: [
      { path: '', loadComponent: () =>
          import('./pages/admin/listado-alumnos/listado-alumnos.component')
            .then(c => c.ListadoAlumnosComponent)
      },
      { path: 'alta', loadComponent: () =>
          import('./pages/admin/add-student/add-student.component')
            .then(m => m.AddStudentComponent)
      },
      {
        path: 'listado',
        loadComponent: () =>
          import('./pages/admin/listado-alumnos/listado-alumnos.component')
            .then(m => m.ListadoAlumnosComponent),
      },
      {
        path: 'detalle/:id',
        loadComponent: () =>
          import('./pages/admin/detalle-alumno/detalle-alumno.component')
            .then(m => m.DetalleAlumnoComponent),
      },
      {
        path: 'carga-notas/:id',
        loadComponent: () =>
          import('./pages/admin/carga-notas/carga-notas.component')
            .then(c => c.CargaNotasComponent),
      },
      {
        path: 'inscripciones/:id',
        loadComponent: () =>
          import('./pages/alumno/inscripciones-cursadas/inscripciones-cursadas.component')
            .then(c => c.InscripcionesCursadasComponent),
      },
      {
        path: 'examenes/:id',
        loadComponent: () =>
          import('./pages/alumno/inscripciones-examen/inscripciones-examen.component')
            .then(c => c.InscripcionesExamenComponent),
      },
    ],
  },

  // ===================== ALUMNO =====================
  {
    path: 'dashboard/student',
    canActivate: [AuthGuard, HasRole('alumno')],
    loadComponent: () =>
      import('./pages/alumno/menu-alumno/menu-alumno.component')
        .then(m => m.MenuAlumnoComponent),
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
          import('./pages/deuda/deuda.component').then(c => c.DeudaComponent),
      },
      {
        path: 'inscripciones',
        loadComponent: () =>
          import('./pages/alumno/inscripciones-cursadas/inscripciones-cursadas.component')
            .then(c => c.InscripcionesCursadasComponent),
      },
      {
        path: 'examenes',
        loadComponent: () =>
          import('./pages/alumno/inscripciones-examen/inscripciones-examen.component')
            .then(c => c.InscripcionesExamenComponent),
      },
      {
        path: 'notas',
        loadComponent: () =>
          import('./pages/alumno/notas/notas.component')
            .then(c => c.NotasComponent),
      },
      {
        path: 'certificados',
        loadComponent: () =>
          import('./pages/alumno/certificados/certificados.component')
            .then(c => c.CertificadosComponent),
      },
    ],
  },

  // ===================== PROFESOR =====================
  {
    path: 'dashboard/profesor',
    canActivate: [AuthGuard, HasRole('profesor')],
    loadComponent: () =>
      import('./pages/profesor/menu-profesor/menu-profesor.component')
        .then(m => m.MenuProfesorComponent),
    children: [
      {
      path: '',
      loadComponent: () =>
        import('./pages/profesor/inicio-profesor/inicio-profesor.component')
          .then(c => c.InicioProfesorComponent),
    },
    {
      path: 'cargar-notas-examen/:id',
      loadComponent: () =>
        import('./pages/profesor/carga-notas-examen-profesor/carga-notas-examen-profesor.component')
          .then(c => c.CargaNotasExamenProfesorComponent),
    },
    {
      path: 'cargar-notas-cursada/:id',
      loadComponent: () =>
        import('./pages/profesor/carga-notas-cursada-profesor/carga-notas-cursada-profesor.component')
          .then(c => c.CargaNotasCursadaProfesorComponent),
    }

    ],
  },

];
