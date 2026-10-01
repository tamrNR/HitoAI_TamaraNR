// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

// ==============================
// IMPORTACIÓN DE COMPONENTES CON ALIAS ÚNICOS
// ==============================
import { HomeComponent as HomeAdminComponent } from './modules/admin/home/home.component';
import { HomeComponent as HomeJefeCarreraComponent } from './modules/jefe-carrera/home/home.component';
import { HomeComponent as HomeProfesorComponent } from './modules/profesor/home/home.component';
import { HomeComponent as HomeComiteComponent } from './modules/comite/home/home.component';

import { LoginComponent } from './modules/login/login.component';

// ==============================
// RUTAS PRINCIPALES
// ==============================
export const routes: Routes = [
  // Redirect raíz
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Login
  { path: 'login', component: LoginComponent },

  // ==============================
  // ADMIN
  // ==============================
  { path: 'admin', component: HomeAdminComponent, canActivate: [AuthGuard] },
  {
    path: 'admin/carreras',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/admin/carreras/main-carreras/main-carreras.component')
        .then(m => m.MainCarrerasComponent)
  },
  {
    path: 'admin/asignaturas',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/admin/asignaturas/main-asignaturas/main-asignaturas.component')
        .then(m => m.MainAsignaturasComponent),
    data: { role: ['Administrador', 'Jefe de Carrera'] }
  },
  {
    path: 'admin/usuarios',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/admin/usuarios/main-usuarios/main-usuarios.component')
        .then(m => m.MainUsuariosComponent)
  },
  {
    path: 'admin/contenidos',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/contenidos/main-contenidos/main-contenidos.component')
        .then(m => m.MainContenidosComponent)
  },
  {
    path: 'admin/ra',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/competencia-ra/ra-main/ra-main.component')
        .then(m => m.MainRaComponent)
  },
  {
    path: 'admin/asignaturas-hito',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/rubricas/main-asignaturas-jefe/main-asignaturas-jefe.component')
        .then(m => m.MainAsignaturasJefeComponent),
    data: { role: ['Administrador', 'Profesor'] }
  },
  {
    path: 'admin/analitica',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/analitica/analitica.module')
        .then(m => m.AnaliticaModule),
    data: { role: ['Administrador', 'Jefe de Carrera', 'Comité Curricular'] }
  },

  // ==============================
  // JEFE DE CARRERA
  // ==============================
  { path: 'jefe-carrera', component: HomeJefeCarreraComponent, canActivate: [AuthGuard] },
  {
    path: 'jefe-carrera/asignaturas',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/rubricas/main-asignaturas-jefe/main-asignaturas-jefe.component')
        .then(m => m.MainAsignaturasJefeComponent)
  },
  {
    path: 'jefe-carrera/ra',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/competencia-ra/ra-main/ra-main.component')
        .then(m => m.MainRaComponent)
  },
  {
    path: 'jefe-carrera/analitica',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/analitica/analitica.module')
        .then(m => m.AnaliticaModule),
    data: { role: ['Administrador', 'Jefe de Carrera', 'Comité Curricular'] }
  },

  // ==============================
  // PROFESOR (Lazy-loaded module)
  // ==============================
  {
    path: 'profesor',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/profesor/profesor.module').then(m => m.ProfesorModule)
  },

  // ==============================
  // COMITÉ CURRICULAR
  // ==============================
  { path: 'comite', component: HomeComiteComponent, canActivate: [AuthGuard] },
  {
    path: 'comite/ra',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/competencia-ra/ra-main/ra-main.component')
        .then(m => m.MainRaComponent)
  },
  {
    path: 'comite/contenidos',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/contenidos/main-contenidos/main-contenidos.component')
        .then(m => m.MainContenidosComponent)
  },
  {
    path: 'comite/analitica',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/analitica/analitica.module')
        .then(m => m.AnaliticaModule),
    data: { role: ['Administrador', 'Jefe de Carrera', 'Comité Curricular'] }
  },

  // ==============================
  // Fallback 404 -> login (ajusta si tienes una página 404 propia)
  // ==============================
  { path: '**', redirectTo: 'login' }
];
