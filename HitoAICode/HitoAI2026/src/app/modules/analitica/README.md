# Módulo de Analítica

## Descripción
Módulo Angular para visualización de análisis y gráficos usando Chart.js y ng2-charts.

## Características
- ✅ Gráficos interactivos (barras, líneas, pastel, radar, dona)
- ✅ Diseño responsive con SCSS
- ✅ Tarjetas de resumen con tendencias
- ✅ Sistema de filtros
- ✅ Tabla de métricas con estados visuales
- ✅ Datos de ejemplo pre-cargados

## Dependencias
- `chart.js@^4.5.1`
- `ng2-charts@^8.0.0`
- `@angular/common`
- `@angular/forms` (FormsModule y ReactiveFormsModule)

## Rutas Disponibles

### 1. Análisis General
```
/analitica/general
```
Muestra gráficos de barras y líneas con tarjetas de resumen.

### 2. Análisis Específico (con parámetro)
```
/analitica/detalle/:grafico
```
Donde `:grafico` puede ser:
- `radar` - Para gráfico de radar
- `barras` - Para gráfico de barras
- `pastel` - Para gráfico de pastel
- `dona` - Para gráfico de dona
- `todos` - Para mostrar todos los gráficos (por defecto)

Ejemplos:
- `/analitica/detalle/radar`
- `/analitica/detalle/barras`

## Integración en Otros Módulos

### En `profesor-routing.module.ts` o similar:

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // ... otras rutas ...
  
  {
    path: 'analitica',
    loadChildren: () => import('../analitica/analitica.module')
      .then(m => m.AnaliticaModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfesorRoutingModule { }
```

### En `jefe-carrera-routing.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // ... otras rutas ...
  
  {
    path: 'analitica',
    loadChildren: () => import('../analitica/analitica.module')
      .then(m => m.AnaliticaModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JefeCarreraRoutingModule { }
```

## Uso desde la Aplicación

### Acceso desde Profesor:
```
/profesor/analitica/general
/profesor/analitica/detalle/radar
```

### Acceso desde Jefe de Carrera:
```
/jefe-carrera/analitica/general
/jefe-carrera/analitica/detalle/barras
```

## Navegación Programática

Desde cualquier componente:

```typescript
import { Router } from '@angular/router';

constructor(private router: Router) {}

// Navegar a análisis general
irAGeneral() {
  this.router.navigate(['/profesor/analitica/general']);
}

// Navegar a análisis específico con parámetro
irARadar() {
  this.router.navigate(['/profesor/analitica/detalle', 'radar']);
}
```

## Estructura de Archivos

```
src/app/modules/analitica/
├── analitica.module.ts              # Módulo principal
├── analitica-routing.module.ts      # Configuración de rutas
├── index.ts                         # Barrel exports
├── components/
│   ├── index.ts                     # Barrel exports de componentes
│   ├── an-general/
│   │   ├── an-general.component.ts
│   │   ├── an-general.component.html
│   │   └── an-general.component.css
│   └── an-especifico/
│       ├── an-especifico.component.ts
│       ├── an-especifico.component.html
│       └── an-especifico.component.css
└── services/
    └── analitica.service.ts         # Servicio para obtener datos
```

## Servicio de Analítica

El servicio `AnaliticaService` proporciona métodos para:

```typescript
// Obtener datos para análisis general
obtenerDatosGenerales(): Observable<DatosGenerales>

// Obtener datos para análisis específico
obtenerDatosEspecificos(filtro: string, categoria: string): Observable<DatosEspecificos>

// Exportar datos
exportarDatos(formato: string): Observable<Blob>
```

## Personalización

Para conectar con tu backend, edita `analitica.service.ts` y descomenta las líneas de las llamadas HTTP reales.

## Estilos

El módulo usa Bootstrap 5 y Bootstrap Icons. Asegúrate de tenerlos instalados en tu proyecto.
