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

// Roles reutilizables
const ADMIN = ['Administrador'];
const JEFE = ['Jefe de Carrera'];
const PROFESOR = ['Profesor'];
const COMITE = ['Comité Curricular'];
const DECANO = ['Decano'];
const ESTRUCTURA = ['Administrador', 'Jefe de Carrera', 'Comité Curricular'];
const ANALITICA = ['Administrador', 'Jefe de Carrera', 'Comité Curricular', 'Decano'];

// ==============================
// RUTAS PRINCIPALES
// ==============================
export const routes: Routes = [
  // Redirect raíz
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Login (público)
  { path: 'login', component: LoginComponent },

  // ==============================
  // ADMINISTRADOR
  // ==============================
  { path: 'admin', component: HomeAdminComponent, canActivate: [AuthGuard], data: { role: ADMIN } },
  {
    path: 'admin/carreras',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/admin/carreras/main-carreras/main-carreras.component')
        .then(m => m.MainCarrerasComponent),
    data: { role: ADMIN }
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
        .then(m => m.MainUsuariosComponent),
    data: { role: ADMIN }
  },
  {
    path: 'admin/contenidos',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/contenidos/main-contenidos/main-contenidos.component')
        .then(m => m.MainContenidosComponent),
    data: { role: ESTRUCTURA }
  },
  {
    path: 'admin/ra',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/competencia-ra/ra-main/ra-main.component')
        .then(m => m.MainRaComponent),
    data: { role: ESTRUCTURA }
  },
  {
    path: 'admin/asignaturas-hito',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/rubricas/main-asignaturas-jefe/main-asignaturas-jefe.component')
        .then(m => m.MainAsignaturasJefeComponent),
    data: { role: ['Administrador', 'Profesor', 'Jefe de Carrera'] }
  },
  {
    path: 'admin/analitica',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/analitica/analitica.module')
        .then(m => m.AnaliticaModule),
    data: { role: ANALITICA }
  },

  // ==============================
  // JEFE DE CARRERA
  // ==============================
  { path: 'jefe-carrera', component: HomeJefeCarreraComponent, canActivate: [AuthGuard], data: { role: JEFE } },
  {
    path: 'jefe-carrera/asignaturas',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/rubricas/main-asignaturas-jefe/main-asignaturas-jefe.component')
        .then(m => m.MainAsignaturasJefeComponent),
    data: { role: ['Administrador', 'Jefe de Carrera'] }
  },
  {
    path: 'jefe-carrera/ra',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/competencia-ra/ra-main/ra-main.component')
        .then(m => m.MainRaComponent),
    data: { role: ['Administrador', 'Jefe de Carrera', 'Comité Curricular'] }
  },
  {
    path: 'jefe-carrera/analitica',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/analitica/analitica.module')
        .then(m => m.AnaliticaModule),
    data: { role: ANALITICA }
  },

  // ==============================
  // PROFESOR
  // ==============================
  {
    path: 'profesor',
    canActivate: [AuthGuard],
    data: { role: PROFESOR },
    loadChildren: () =>
      import('./modules/profesor/profesor.module').then(m => m.ProfesorModule)
  },

  // ==============================
  // COMITÉ CURRICULAR
  // ==============================
  {
    path: 'comite',
    component: HomeComiteComponent,
    canActivate: [AuthGuard],
    data: { role: ['Comité Curricular', 'Administrador'] }
  },
  {
    path: 'comite/ra',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/competencia-ra/ra-main/ra-main.component')
        .then(m => m.MainRaComponent),
    data: { role: ['Administrador', 'Jefe de Carrera', 'Comité Curricular'] }
  },
  {
    path: 'comite/contenidos',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./modules/contenidos/main-contenidos/main-contenidos.component')
        .then(m => m.MainContenidosComponent),
    data: { role: ESTRUCTURA }
  },
  {
    path: 'comite/analitica',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/analitica/analitica.module')
        .then(m => m.AnaliticaModule),
    data: { role: ANALITICA }
  },

  // ==============================
  // DECANO: mismo módulo de analítica que Admin/Jefe/Comité, solo lectura
  // (el backend limita carreras/asignaturas a su facultad)
  // ==============================
  {
    path: 'decano',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/analitica/analitica.module')
        .then(m => m.AnaliticaModule),
    data: { role: DECANO }
  },

  // ==============================
  // Fallback 404 -> login
  // ==============================
  { path: '**', redirectTo: 'login' }
];
