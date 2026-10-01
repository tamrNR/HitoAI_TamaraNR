# ✅ Solución CORS Completada - Backend Express + Frontend Angular

## 🎯 Problema Resuelto

**ANTES:**
- ❌ Backend corriendo en puerto **3000**
- ❌ Frontend intentando conectar a puerto **8080**
- ❌ Errores CORS bloqueando peticiones

**AHORA:**
- ✅ Backend corriendo en puerto **8080**
- ✅ CORS configurado para aceptar Angular
- ✅ Peticiones HTTP funcionando correctamente

---

## 📋 Cambios Implementados

### 1. **Archivo `backend/app.js` actualizado**

#### A. Configuración CORS mejorada:
```javascript
const allowedOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:16378' // Puerto dinámico de Angular
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como Postman)
    if (!origin) return callback(null, true);
    
    // Verificar si el origen está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('❌ Bloqueado por CORS:', origin);
    return callback(new Error('No autorizado por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
```

**Ventajas:**
- ✅ Acepta peticiones desde `localhost:4200` (Angular dev server)
- ✅ Acepta peticiones desde `127.0.0.1:4200` (IP local)
- ✅ Acepta peticiones desde puertos dinámicos de Angular
- ✅ Permite peticiones sin origen (Postman, Thunder Client)
- ✅ Logs detallados de peticiones bloqueadas

#### B. Puerto cambiado a 8080:
```javascript
const PORT = process.env.PORT || 8080; // ✅ Cambiado de 3000 a 8080
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
});
```

---

## 🚀 Cómo Iniciar el Backend

### Opción 1: Usando el script de PowerShell (Recomendado)

```powershell
cd backend
.\iniciar-backend-8080.ps1
```

**El script automáticamente:**
- ✅ Verifica que estés en el directorio correcto
- ✅ Crea el archivo `.env` si no existe
- ✅ Instala dependencias si faltan
- ✅ Inicia el servidor en puerto 8080

### Opción 2: Comando directo

```powershell
cd backend
node app.js
```

---

## 🔍 Verificación de Funcionamiento

### 1. **Verificar que el backend está corriendo:**

Deberías ver en la consola:
```
🧩 Cargando rutas...
✅ Todas las rutas cargadas correctamente
🚀 Servidor corriendo en http://localhost:8080
📡 API disponible en http://localhost:8080/api
✅ Conectado a la base de datos MySQL
```

### 2. **Probar endpoint de prueba en el navegador:**

Abre en Chrome:
```
http://localhost:8080/api/carrera
```

**Respuesta esperada:**
```json
[
  {
    "id": 4,
    "nombre": "Ingeniería Civil En Informatica"
  }
]
```

### 3. **Verificar CORS en DevTools:**

1. Abre la aplicación Angular en Chrome
2. Abre DevTools (F12)
3. Ve a la pestaña **Network**
4. Genera gráficos en `/profesor/analitica/general`
5. Busca las peticiones a `localhost:8080`

**Deberías ver:**
- ✅ Estado: **200 OK** (verde)
- ✅ Headers de respuesta incluyen:
  ```
  Access-Control-Allow-Origin: http://127.0.0.1:16378
  Access-Control-Allow-Credentials: true
  ```

---

## 📡 Endpoints Disponibles

### Filtros (GET):
```
GET http://localhost:8080/api/carrera
GET http://localhost:8080/api/asignatura
GET http://localhost:8080/api/estudiante
```

### Gráficos de Analítica (GET):
```
GET http://localhost:8080/api/graficos/radar?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8
GET http://localhost:8080/api/graficos/barras?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8
GET http://localhost:8080/api/graficos/burbujas?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8
```

### Endpoint de prueba:
```
GET http://localhost:8080/api/graficos/test
```

---

## 🧪 Pruebas con cURL

### Probar endpoint de carreras:
```bash
curl http://localhost:8080/api/carrera
```

### Probar endpoint de gráfico radar:
```bash
curl "http://localhost:8080/api/graficos/radar?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8"
```

### Probar con headers CORS:
```bash
curl -H "Origin: http://localhost:4200" -v http://localhost:8080/api/carrera
```

**Deberías ver en la respuesta:**
```
< Access-Control-Allow-Origin: http://localhost:4200
< Access-Control-Allow-Credentials: true
```

---

## 🛠️ Solución de Problemas

### Problema 1: "Error: listen EADDRINUSE :::8080"

**Causa:** El puerto 8080 ya está en uso.

**Solución:**
```powershell
# Encontrar el proceso usando el puerto 8080
netstat -ano | findstr :8080

# Matar el proceso (reemplaza PID con el número obtenido)
taskkill /PID <PID> /F

# O cambiar el puerto en .env
PORT=8081
```

### Problema 2: "Cannot connect to MySQL"

**Causa:** Credenciales incorrectas en `.env`

**Solución:**
1. Abre `backend/.env`
2. Verifica las credenciales:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=TU_CONTRASEÑA
   DB_NAME=hitoai
   DB_PORT=3306
   ```
3. Reinicia el backend

### Problema 3: "CORS error" en Angular

**Causa:** El origen de Angular no está en la lista permitida.

**Solución:**
1. Verifica en la consola del backend qué origen está siendo bloqueado
2. Agrégalo al array `allowedOrigins` en `app.js`:
   ```javascript
   const allowedOrigins = [
     'http://localhost:4200',
     'http://127.0.0.1:4200',
     'http://127.0.0.1:16378',
     'http://TU_ORIGEN_AQUI' // ← Agregar aquí
   ];
   ```
3. Reinicia el backend

### Problema 4: "Module not found"

**Causa:** Dependencias no instaladas.

**Solución:**
```powershell
cd backend
npm install
```

---

## 📝 Archivo `.env` Requerido

Si no existe, créalo en `backend/.env`:

```env
# Configuración de la base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hitoai
DB_PORT=3306

# Puerto del servidor (IMPORTANTE: debe ser 8080)
PORT=8080
```

**⚠️ IMPORTANTE:** Reemplaza `DB_PASSWORD` con tu contraseña de MySQL.

---

## ✅ Checklist de Verificación

Antes de probar en Angular, verifica:

- [ ] Backend corriendo en puerto **8080** (no 3000)
- [ ] Consola muestra "✅ Conectado a la base de datos MySQL"
- [ ] `http://localhost:8080/api/carrera` devuelve JSON
- [ ] No hay errores CORS en la consola del backend
- [ ] Frontend Angular corriendo en `http://localhost:4200` o similar
- [ ] Archivo `.env` tiene las credenciales correctas de MySQL

---

## 🎉 Resultado Esperado

**En el frontend Angular:**
1. Navega a `/profesor/analitica/general`
2. Selecciona filtros (asignatura, alumno, año, semestre)
3. Presiona "Generar Análisis"
4. Los 3 gráficos se cargan con datos reales del backend
5. **NO** hay errores CORS en la consola de Chrome

**En la consola del backend:**
```
[Graficos] 📡 GET /api/graficos/radar - Parámetros: {...}
[Graficos] ✅ Datos de radar enviados: 4 competencias
[Graficos] 📡 GET /api/graficos/barras - Parámetros: {...}
[Graficos] ✅ Datos de barras enviados: 4 competencias
[Graficos] 📡 GET /api/graficos/burbujas - Parámetros: {...}
[Graficos] ✅ Datos de burbujas enviados: 10 evaluaciones
```

---

## 📚 Documentación Adicional

- **Endpoints de gráficos:** Ver `ENDPOINTS_GRAFICOS_IMPLEMENTADOS.md`
- **Integración frontend:** Ver `CONEXION_BACKEND_COMPLETADA.md`
- **Vistas MySQL:** Ver queries en `backend/routes/graficos.routes.js`

---

**✅ La conexión entre Angular y Express está completamente funcional.**

**🚀 El módulo de analítica ahora consume datos reales del backend con CORS configurado correctamente.**
