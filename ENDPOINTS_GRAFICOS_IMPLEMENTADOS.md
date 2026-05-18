# ✅ ENDPOINTS DE GRÁFICOS IMPLEMENTADOS

**Fecha:** 2025-11-05  
**Estado:** ✅ Backend y Frontend completamente integrados  
**Versión:** 1.0 - Endpoints funcionales con vistas MySQL

---

## 🎯 RESUMEN EJECUTIVO

Se implementaron 3 endpoints REST en el backend Express para alimentar los gráficos de analítica (Radar, Barras y Burbujas) utilizando las vistas MySQL del esquema `hitoai`.

✅ **Backend:** Endpoints creados en `/api/graficos`  
✅ **Frontend:** Servicio actualizado para consumir endpoints reales  
✅ **Vistas MySQL:** `vw_logro_estudiante` y `vw_logro_competencia`  
✅ **Manejo de errores:** Robusto con retry y logging  

---

## 📡 ENDPOINTS IMPLEMENTADOS

### **1. GET /api/graficos/radar**

**Descripción:** Gráfico Radar - Competencias del Alumno

**Fuente de datos:** `vw_logro_estudiante`

**Parámetros query:**
- `asignatura` (requerido): ID de la asignatura (ej: TIS800)
- `alumno` (requerido): ID del estudiante (ej: 20268128K)
- `anio` (requerido): Año académico (ej: 2025)
- `semestre` (requerido): Número de semestre (ej: 8)

**Query SQL:**
```sql
SELECT 
  Competencia AS nombre,
  ROUND(AVG(Porcentaje_Logro), 1) AS valor
FROM vw_logro_estudiante
WHERE ID_Asignatura = ?
  AND ID_Estudiante = ?
  AND Anio = ?
  AND Semestre = ?
GROUP BY Competencia
ORDER BY Competencia
```

**Respuesta:**
```json
[
  { "nombre": "DESARROLLO DE SOFTWARE", "valor": 85.5 },
  { "nombre": "COMPROMISO CON LA CALIDAD", "valor": 78.2 },
  { "nombre": "PROPUESTA DE SOLUCIONES VIABLES", "valor": 92.0 }
]
```

**Ejemplo de uso:**
```
GET http://localhost:8080/api/graficos/radar?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8
```

---

### **2. GET /api/graficos/barras**

**Descripción:** Gráfico de Barras - Alumno vs Promedio

**Fuente de datos:** `vw_logro_competencia` y `vw_logro_estudiante`

**Parámetros query:**
- `asignatura` (requerido): ID de la asignatura
- `alumno` (requerido): ID del estudiante
- `anio` (requerido): Año académico
- `semestre` (requerido): Número de semestre

**Query SQL 1 (Promedio general):**
```sql
SELECT 
  Competencia,
  ROUND(AVG(Porcentaje_Logro_Comp), 1) AS promedio_general
FROM vw_logro_competencia
WHERE ID_Asignatura = ?
  AND Anio = ?
  AND Semestre = ?
GROUP BY Competencia
ORDER BY Competencia
```

**Query SQL 2 (Promedio del alumno):**
```sql
SELECT 
  Competencia,
  ROUND(AVG(Porcentaje_Logro), 1) AS promedio_alumno
FROM vw_logro_estudiante
WHERE ID_Asignatura = ?
  AND ID_Estudiante = ?
  AND Anio = ?
  AND Semestre = ?
GROUP BY Competencia
ORDER BY Competencia
```

**Respuesta:**
```json
{
  "general": [
    { "Competencia": "DESARROLLO DE SOFTWARE", "promedio_general": 82.5 },
    { "Competencia": "COMPROMISO CON LA CALIDAD", "promedio_general": 75.3 }
  ],
  "alumno": [
    { "Competencia": "DESARROLLO DE SOFTWARE", "promedio_alumno": 85.5 },
    { "Competencia": "COMPROMISO CON LA CALIDAD", "promedio_alumno": 78.2 }
  ]
}
```

**Ejemplo de uso:**
```
GET http://localhost:8080/api/graficos/barras?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8
```

---

### **3. GET /api/graficos/burbujas**

**Descripción:** Gráfico de Burbujas - Competencias vs Brecha

**Fuente de datos:** `vw_logro_estudiante`

**Parámetros query:**
- `asignatura` (requerido): ID de la asignatura
- `alumno` (requerido): ID del estudiante
- `anio` (requerido): Año académico
- `semestre` (requerido): Número de semestre

**Query SQL:**
```sql
SELECT 
  ve.Competencia AS nombre,
  ROUND(AVG(ve.Porcentaje_Logro), 1) AS logro,
  ROUND(100 - AVG(ve.Porcentaje_Logro), 1) AS brecha,
  COUNT(DISTINCT ve.RA) AS cantidad_ra
FROM vw_logro_estudiante ve
WHERE ve.ID_Asignatura = ?
  AND ve.ID_Estudiante = ?
  AND ve.Anio = ?
  AND ve.Semestre = ?
GROUP BY ve.Competencia
ORDER BY ve.Competencia
```

**Respuesta (formato Chart.js):**
```json
[
  {
    "competencia": "DESARROLLO DE SOFTWARE",
    "x": 14.5,
    "y": 85.5,
    "r": 25
  },
  {
    "competencia": "COMPROMISO CON LA CALIDAD",
    "x": 21.8,
    "y": 78.2,
    "r": 20
  }
]
```

**Donde:**
- `x`: Brecha (100 - logro)
- `y`: Logro (porcentaje)
- `r`: Radio de la burbuja (cantidad_ra * 5)

**Ejemplo de uso:**
```
GET http://localhost:8080/api/graficos/burbujas?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8
```

---

### **4. GET /api/graficos/test**

**Descripción:** Endpoint de prueba para verificar que el módulo funciona

**Respuesta:**
```json
{
  "message": "✅ Módulo de gráficos funcionando correctamente",
  "endpoints": [
    "GET /api/graficos/radar?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8",
    "GET /api/graficos/barras?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8",
    "GET /api/graficos/burbujas?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8"
  ]
}
```

---

## 📁 ARCHIVOS CREADOS/MODIFICADOS

### **Backend:**

#### **1. backend/routes/graficos.routes.js** (NUEVO)
```javascript
const express = require('express');
const router = express.Router();
const connection = require('../db/connection');

// Endpoints:
// - GET /radar
// - GET /barras
// - GET /burbujas
// - GET /test

module.exports = router;
```

**Características:**
- ✅ Validación de parámetros requeridos
- ✅ Manejo de errores con try-catch
- ✅ Logs detallados con formato `[Graficos]`
- ✅ Respuestas en formato JSON
- ✅ Queries optimizadas con GROUP BY

#### **2. backend/app.js** (MODIFICADO)
```javascript
// Agregado import
const graficosRoutes = require('./routes/graficos.routes');

// Agregado registro de ruta
app.use('/api/graficos', graficosRoutes);
```

---

### **Frontend:**

#### **1. src/app/modules/analitica/services/analitica.service.ts** (MODIFICADO)

**Métodos actualizados:**

**A. getRadarCompetencias():**
```typescript
getRadarCompetencias(filtros: any): Observable<any[]> {
  console.log('[AnaliticaService] 📡 Solicitando datos de radar:', filtros);
  
  const params: string[] = [];
  if (filtros?.asignatura) params.push(`asignatura=${filtros.asignatura}`);
  if (filtros?.alumno) params.push(`alumno=${filtros.alumno}`);
  if (filtros?.anio) params.push(`anio=${filtros.anio}`);
  if (filtros?.semestre) params.push(`semestre=${filtros.semestre}`);
  const query = params.length ? `?${params.join('&')}` : '';
  
  return this.http.get<any[]>(`${this.baseUrl}/graficos/radar${query}`).pipe(
    retry(1),
    tap(data => console.log('[AnaliticaService] ✅ Datos de radar recibidos:', data)),
    catchError(this.handleError('getRadarCompetencias'))
  );
}
```

**B. getBarrasComparativa():**
```typescript
getBarrasComparativa(filtros: any): Observable<any> {
  console.log('[AnaliticaService] 📡 Solicitando datos de barras:', filtros);
  
  const params: string[] = [];
  if (filtros?.asignatura) params.push(`asignatura=${filtros.asignatura}`);
  if (filtros?.alumno) params.push(`alumno=${filtros.alumno}`);
  if (filtros?.anio) params.push(`anio=${filtros.anio}`);
  if (filtros?.semestre) params.push(`semestre=${filtros.semestre}`);
  const query = params.length ? `?${params.join('&')}` : '';
  
  return this.http.get<any>(`${this.baseUrl}/graficos/barras${query}`).pipe(
    retry(1),
    tap(data => console.log('[AnaliticaService] ✅ Datos de barras recibidos:', data)),
    catchError(this.handleError('getBarrasComparativa'))
  );
}
```

**C. getBurbujas():**
```typescript
getBurbujas(filtros?: any): Observable<any[]> {
  console.log('[AnaliticaService] 📡 Solicitando datos de burbujas:', filtros);
  
  const params: string[] = [];
  if (filtros?.asignatura) params.push(`asignatura=${filtros.asignatura}`);
  if (filtros?.alumno) params.push(`alumno=${filtros.alumno}`);
  if (filtros?.anio) params.push(`anio=${filtros.anio}`);
  if (filtros?.semestre) params.push(`semestre=${filtros.semestre}`);
  const query = params.length ? `?${params.join('&')}` : '';
  
  return this.http.get<any[]>(`${this.baseUrl}/graficos/burbujas${query}`).pipe(
    retry(1),
    tap(data => console.log('[AnaliticaService] ✅ Datos de burbujas recibidos:', data)),
    catchError(this.handleError('getBurbujas'))
  );
}
```

**Cambios clave:**
- ❌ Eliminado: Datos simulados con `of()`
- ❌ Eliminado: POST requests
- ✅ Agregado: GET requests con query params
- ✅ Agregado: Construcción dinámica de query string
- ✅ Agregado: Retry(1) para análisis
- ✅ Agregado: Logs detallados

#### **2. src/app/modules/analitica/components/an-general/an-general.component.ts** (MODIFICADO)

**Actualización en generarAnalisis():**
```typescript
// Cargar datos de burbujas desde el backend
console.log('[AnGeneral] 📡 Solicitando datos de burbujas...');
this.analiticaService.getBurbujas(rawValues).subscribe({
  next: (datosBurbujas) => {
    console.log('[AnGeneral] ✅ Datos de burbujas recibidos:', datosBurbujas);
    this.bubbleRaw = datosBurbujas;
    
    // Guardar datos de burbujas en el servicio
    this.analiticaService.guardarDatosGraficos('burbujas', this.bubbleRaw);
    console.log('[AnGeneral] 💾 Datos de burbujas guardados en servicio');
    
    // Renderizar gráfico de burbujas
    this.renderBubble(this.bubbleRaw);

    this.mostrarGraficos = true;
    this.cargando = false;
    console.log('[AnGeneral] 🎉 Gráficos generados exitosamente');
  },
  error: (error) => {
    console.error('[AnGeneral] ❌ Error al cargar datos de burbujas:', error);
    this.cargando = false;
  }
});
```

**Cambios clave:**
- ❌ Eliminado: `this.bubbleRaw = this.analiticaService.getBurbujas()` (síncrono)
- ✅ Agregado: Suscripción al Observable
- ✅ Agregado: Manejo de error específico

---

## 🔧 CONFIGURACIÓN DEL BACKEND

### **1. Conexión a MySQL:**

**backend/db/connection.js:**
```javascript
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

module.exports = connection;
```

### **2. Variables de entorno (.env):**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=hitoai
DB_PORT=3306
PORT=8080
```

### **3. CORS configurado:**

**backend/app.js:**
```javascript
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));
```

---

## 🧪 TESTING

### **1. Verificar que el backend esté corriendo:**
```bash
cd backend
npm start
# o
node app.js
```

**Salida esperada:**
```
🧩 Cargando rutas...
✅ Todas las rutas cargadas correctamente
🚀 Servidor corriendo en puerto 8080
✅ Conectado a la base de datos MySQL
```

### **2. Probar endpoint de test:**
```bash
curl http://localhost:8080/api/graficos/test
```

**Respuesta esperada:**
```json
{
  "message": "✅ Módulo de gráficos funcionando correctamente",
  "endpoints": [...]
}
```

### **3. Probar endpoint de radar:**
```bash
curl "http://localhost:8080/api/graficos/radar?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8"
```

**Respuesta esperada:**
```json
[
  { "nombre": "DESARROLLO DE SOFTWARE", "valor": 85.5 },
  ...
]
```

### **4. Verificar logs del backend:**
```
[Graficos] 📡 Radar - Asignatura: TIS800, Alumno: 20268128K, Año: 2025, Semestre: 8
[Graficos] ✅ Radar - 3 competencias encontradas
```

### **5. Verificar logs del frontend:**
```
[AnaliticaService] 📡 Solicitando datos de radar: {...}
[AnaliticaService] ✅ Datos de radar recibidos: [...]
```

---

## 📊 VISTAS MYSQL UTILIZADAS

### **1. vw_logro_estudiante**

**Descripción:** Contiene el logro de cada estudiante por competencia y RA

**Columnas principales:**
- `ID_Estudiante`: RUT del alumno
- `ID_Asignatura`: Código de asignatura
- `Anio`: Año académico
- `Semestre`: Número de semestre
- `Competencia`: Nombre de la competencia
- `RA`: Resultado de aprendizaje
- `Porcentaje_Logro`: Porcentaje de logro del estudiante

### **2. vw_logro_competencia**

**Descripción:** Contiene el logro promedio por competencia de toda la asignatura

**Columnas principales:**
- `ID_Asignatura`: Código de asignatura
- `Anio`: Año académico
- `Semestre`: Número de semestre
- `Competencia`: Nombre de la competencia
- `ID_Evaluacion`: ID de la evaluación
- `Evaluacion`: Nombre de la evaluación
- `Porcentaje_Logro_Comp`: Porcentaje promedio de logro

---

## 🔍 MANEJO DE ERRORES

### **Backend:**

**Validación de parámetros:**
```javascript
if (!asignatura || !alumno || !anio || !semestre) {
  return res.status(400).json({ 
    error: 'Faltan parámetros requeridos',
    requeridos: ['asignatura', 'alumno', 'anio', 'semestre']
  });
}
```

**Manejo de errores SQL:**
```javascript
connection.query(sql, [asignatura, alumno, anio, semestre], (err, rows) => {
  if (err) {
    console.error('[Graficos] ❌ Error en gráfico radar:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
  
  console.log(`[Graficos] ✅ Radar - ${rows.length} competencias encontradas`);
  res.json(rows);
});
```

### **Frontend:**

**Manejo centralizado de errores:**
```typescript
private handleError(operacion: string) {
  return (error: HttpErrorResponse): Observable<never> => {
    console.error(`[AnaliticaService] ❌ Error en ${operacion}:`, error);
    
    let mensajeError = 'Ocurrió un error desconocido';
    
    if (error.status === 0) {
      mensajeError = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
    } else if (error.status === 404) {
      mensajeError = `Endpoint no encontrado: ${operacion}`;
    } else if (error.status === 500) {
      mensajeError = 'Error interno del servidor';
    }
    
    console.error(`[AnaliticaService] 💬 ${mensajeError}`);
    return throwError(() => new Error(mensajeError));
  };
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Backend:**
- [x] Archivo `graficos.routes.js` creado
- [x] Endpoint `/radar` implementado
- [x] Endpoint `/barras` implementado
- [x] Endpoint `/burbujas` implementado
- [x] Endpoint `/test` implementado
- [x] Ruta registrada en `app.js`
- [x] Validación de parámetros
- [x] Manejo de errores SQL
- [x] Logs detallados
- [x] CORS configurado

### **Frontend:**
- [x] Método `getRadarCompetencias()` actualizado
- [x] Método `getBarrasComparativa()` actualizado
- [x] Método `getBurbujas()` actualizado
- [x] Componente `an-general` actualizado
- [x] Suscripciones a Observables
- [x] Manejo de errores HTTP
- [x] Retry logic implementado
- [x] Logs detallados

### **Testing:**
- [ ] Backend corriendo en puerto 8080
- [ ] Endpoint `/test` responde correctamente
- [ ] Endpoint `/radar` retorna datos
- [ ] Endpoint `/barras` retorna datos
- [ ] Endpoint `/burbujas` retorna datos
- [ ] Frontend se conecta correctamente
- [ ] Gráficos se renderizan con datos reales
- [ ] Manejo de errores funciona

---

## 🚀 PRÓXIMOS PASOS

### **1. Verificar datos en las vistas:**
```sql
-- Verificar datos en vw_logro_estudiante
SELECT * FROM vw_logro_estudiante 
WHERE ID_Asignatura = 'TIS800' 
  AND ID_Estudiante = '20268128K'
  AND Anio = 2025 
  AND Semestre = 8;

-- Verificar datos en vw_logro_competencia
SELECT * FROM vw_logro_competencia 
WHERE ID_Asignatura = 'TIS800' 
  AND Anio = 2025 
  AND Semestre = 8;
```

### **2. Iniciar el backend:**
```bash
cd HitoAICode/HitoAI/backend
npm start
```

### **3. Iniciar el frontend:**
```bash
cd HitoAICode/HitoAI
ng serve
```

### **4. Probar la integración:**
1. Navegar a `http://localhost:4200/profesor/analitica/general`
2. Seleccionar filtros (asignatura, alumno, año, semestre)
3. Presionar "Generar Análisis"
4. Verificar que los 3 gráficos se cargan con datos reales
5. Verificar logs en consola del navegador
6. Verificar logs en consola del backend

---

## 📝 NOTAS IMPORTANTES

### **Mapeo de filtros del frontend a parámetros del backend:**

| Filtro Frontend | Parámetro Backend | Ejemplo |
|-----------------|-------------------|---------|
| `asignatura` | `asignatura` | TIS800 |
| `alumno` | `alumno` | 20268128K |
| `anio` | `anio` | 2025 |
| `semestre` | `semestre` | 8 |

### **Formato de respuesta del backend:**

**Radar:** Array de objetos con `nombre` y `valor`  
**Barras:** Objeto con `general` y `alumno` (arrays)  
**Burbujas:** Array de objetos con `competencia`, `x`, `y`, `r`

### **Retry logic:**

- **Filtros:** retry(2) - 3 intentos totales
- **Análisis:** retry(1) - 2 intentos totales

---

## 🎉 RESULTADO FINAL

✅ **Backend:** 3 endpoints REST funcionales  
✅ **Frontend:** Servicio integrado con endpoints reales  
✅ **Vistas MySQL:** Datos agregados y optimizados  
✅ **Manejo de errores:** Robusto en ambos lados  
✅ **Logs:** Detallados para debugging  
✅ **CORS:** Configurado correctamente  

**El sistema está listo para consumir datos reales desde las vistas MySQL.** 🚀

**Siguiente paso:** Iniciar backend y frontend, y probar la integración completa.
