# ✅ Solución Final CORS - Configuración Universal

## 🎯 Problema Resuelto

El error "❌ Bloqueado por CORS" ocurría porque Angular se ejecuta en puertos dinámicos que cambian cada vez (ej: `http://127.0.0.1:63678`), y la configuración anterior solo permitía puertos específicos.

**SOLUCIÓN:** Configuración CORS con expresión regular que acepta **CUALQUIER puerto** en `localhost` o `127.0.0.1`.

---

## 📋 Cambios Implementados

### **Archivo `backend/app.js` actualizado:**

```javascript
// === CORS UNIVERSAL PARA DESARROLLO LOCAL ===
app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (Postman, Thunder Client, etc.)
    if (!origin) {
      console.log('✅ Petición sin origen permitida (Postman/Thunder Client)');
      return callback(null, true);
    }
    
    // Permitir CUALQUIER puerto en localhost o 127.0.0.1
    const regexLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
    if (regexLocal.test(origin)) {
      console.log('✅ CORS permitido para:', origin);
      return callback(null, true);
    }
    
    // Bloquear otros orígenes
    console.log('❌ Bloqueado por CORS:', origin);
    return callback(new Error('No autorizado por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
```

### **Ruta de prueba agregada:**

```javascript
// === RUTA DE PRUEBA CORS ===
app.get('/api/test', (req, res) => {
  console.log('[Test] 📡 Petición de prueba CORS desde:', req.headers.origin || 'Sin origen');
  res.json({ 
    mensaje: '✅ CORS funcionando correctamente',
    origen: req.headers.origin || 'Sin origen',
    timestamp: new Date().toISOString()
  });
});
```

---

## 🚀 Cómo Iniciar el Backend

### **Opción 1: Script PowerShell (Recomendado)**

```powershell
cd backend
.\iniciar-con-cors.ps1
```

### **Opción 2: Comando directo**

```powershell
cd backend
node app.js
```

**Deberías ver:**
```
🧩 Cargando rutas...
✅ Todas las rutas cargadas correctamente
🚀 Servidor corriendo en http://localhost:8080
📡 API disponible en http://localhost:8080/api
✅ Conectado a la base de datos MySQL
```

---

## 🧪 Verificación Paso a Paso

### **1. Probar endpoint de prueba CORS**

Abre en el navegador:
```
http://localhost:8080/api/test
```

**Respuesta esperada:**
```json
{
  "mensaje": "✅ CORS funcionando correctamente",
  "origen": "Sin origen",
  "timestamp": "2025-11-06T02:46:27.000Z"
}
```

**En la consola del backend deberías ver:**
```
[Test] 📡 Petición de prueba CORS desde: Sin origen
```

---

### **2. Probar desde Angular**

1. **Inicia Angular** (si no está corriendo):
   ```powershell
   cd HitoAI
   ng serve
   ```

2. **Anota el puerto** que Angular usa. Ejemplo:
   ```
   ** Angular Live Development Server is listening on 127.0.0.1:63678 **
   ```

3. **Abre la aplicación** en Chrome:
   ```
   http://127.0.0.1:63678
   ```

4. **Ve al módulo de analítica**:
   ```
   http://127.0.0.1:63678/profesor/analitica/general
   ```

5. **Abre DevTools** (F12) → Pestaña **Console**

6. **Verifica los logs**:
   ```
   [AnaliticaService] 📡 Solicitando carreras...
   [AnaliticaService] ✅ Carreras recibidas: [{id: 4, nombre: "..."}]
   ```

7. **Ve a la pestaña Network**:
   - Busca la petición a `analitica/carreras`
   - Estado debe ser: **200 OK** (verde)
   - Headers de respuesta deben incluir:
     ```
     Access-Control-Allow-Origin: http://127.0.0.1:63678
     Access-Control-Allow-Credentials: true
     ```

**En la consola del backend deberías ver:**
```
✅ CORS permitido para: http://127.0.0.1:63678
[AnaliticaFiltros] 📡 GET /carreras
[AnaliticaFiltros] ✅ Carreras obtenidas: 1
```

---

### **3. Probar filtros en cascada**

En `/profesor/analitica/general`:

1. **Selecciona una carrera** → Dropdown de "Plan" se debe llenar
2. **Selecciona un plan** → Dropdown de "Asignatura" se debe llenar
3. **Selecciona una asignatura** → Dropdown de "Alumno" se debe llenar
4. **Selecciona cohorte y semestre**
5. **Presiona "Generar Análisis"**
6. **Los 3 gráficos deben aparecer** con datos reales

**Logs esperados en backend:**
```
✅ CORS permitido para: http://127.0.0.1:63678
[AnaliticaFiltros] 📡 GET /carreras
[AnaliticaFiltros] ✅ Carreras obtenidas: 1
✅ CORS permitido para: http://127.0.0.1:63678
[AnaliticaFiltros] 📡 GET /planes - Carrera: 4
[AnaliticaFiltros] ✅ Planes obtenidos: 2
✅ CORS permitido para: http://127.0.0.1:63678
[AnaliticaFiltros] 📡 GET /asignaturas - Carrera: 4 Plan: 2019
[AnaliticaFiltros] ✅ Asignaturas obtenidas: 5
✅ CORS permitido para: http://127.0.0.1:63678
[AnaliticaFiltros] 📡 GET /alumnos - Asignatura: 1 Cohorte: 2020
[AnaliticaFiltros] ✅ Alumnos obtenidos: 3
```

---

## 🔍 Expresión Regular Explicada

```javascript
const regexLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
```

**Desglose:**
- `^` - Inicio de la cadena
- `https?` - Protocolo http o https
- `:\/\/` - Separador ://
- `(localhost|127\.0\.0\.1)` - Dominio localhost O 127.0.0.1
- `(:\d+)?` - Puerto opcional (cualquier número)
- `$` - Fin de la cadena

**Ejemplos que coinciden:**
- ✅ `http://localhost:4200`
- ✅ `http://127.0.0.1:63678`
- ✅ `http://localhost:8080`
- ✅ `https://localhost:3000`
- ✅ `http://127.0.0.1:16378`

**Ejemplos que NO coinciden:**
- ❌ `http://192.168.1.100:4200` (IP diferente)
- ❌ `http://example.com` (dominio externo)
- ❌ `http://localhost.com:4200` (dominio diferente)

---

## 🛠️ Solución de Problemas

### **Problema 1: "❌ Bloqueado por CORS" sigue apareciendo**

**Causa:** El backend no se reinició con la nueva configuración.

**Solución:**
1. Detén el backend actual (Ctrl+C)
2. Reinicia con: `node app.js`
3. Verifica que veas el mensaje: `🚀 Servidor corriendo en http://localhost:8080`

---

### **Problema 2: "No se cargan los filtros"**

**Causa:** Backend no está corriendo o está en puerto incorrecto.

**Verificar:**
1. Backend corriendo en puerto **8080** (no 3000)
2. Archivo `.env` tiene `PORT=8080`
3. Endpoint de prueba funciona: `http://localhost:8080/api/test`

---

### **Problema 3: "Error de conexión a MySQL"**

**Causa:** Credenciales incorrectas en `.env`

**Solución:**
1. Abre `backend/.env`
2. Verifica:
   ```
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=TU_CONTRASEÑA_AQUI
   DB_NAME=hitoai
   DB_PORT=3306
   PORT=8080
   ```
3. Reinicia el backend

---

### **Problema 4: "Cannot find module"**

**Causa:** Dependencias no instaladas.

**Solución:**
```powershell
cd backend
npm install
node app.js
```

---

## 📊 Flujo Completo de Petición

```
┌─────────────────────────────────────────────────────────────┐
│  NAVEGADOR (Chrome)                                          │
│  http://127.0.0.1:63678/profesor/analitica/general          │
│                                                               │
│  1. Angular carga componente                                │
│  2. Llama analiticaService.getCarreras()                    │
│  3. HTTP GET → http://localhost:8080/api/analitica/carreras │
│     Origin: http://127.0.0.1:63678                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND EXPRESS (Puerto 8080)                               │
│                                                               │
│  1. Recibe petición con Origin: http://127.0.0.1:63678     │
│  2. Middleware CORS ejecuta:                                │
│     - Verifica regex: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
│     - Coincide ✅                                           │
│     - Log: "✅ CORS permitido para: http://127.0.0.1:63678" │
│     - Agrega headers:                                       │
│       Access-Control-Allow-Origin: http://127.0.0.1:63678  │
│       Access-Control-Allow-Credentials: true               │
│  3. Router → analitica-filtros.routes.js                    │
│  4. Query SQL a MySQL                                       │
│  5. Devuelve JSON: [{id: 4, nombre: "..."}]                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  NAVEGADOR (Chrome)                                          │
│                                                               │
│  1. Recibe respuesta 200 OK                                 │
│  2. Verifica headers CORS ✅                                │
│  3. Angular procesa datos                                   │
│  4. Dropdown de "Carrera" se llena                          │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Final

Antes de usar la aplicación:

- [ ] Backend corriendo en puerto **8080**
- [ ] Archivo `.env` con `PORT=8080` y credenciales MySQL correctas
- [ ] Base de datos `hitoai` existe y tiene datos
- [ ] Endpoint de prueba funciona: `http://localhost:8080/api/test`
- [ ] Angular corriendo (cualquier puerto)
- [ ] No hay errores en consola de Chrome (F12)
- [ ] Logs del backend muestran: `✅ CORS permitido para: http://127.0.0.1:XXXXX`

---

## 🎉 Resultado Final

Con esta configuración:

✅ **CORS funciona con CUALQUIER puerto** de Angular  
✅ **No necesitas actualizar la configuración** cada vez que Angular cambia de puerto  
✅ **Logs detallados** muestran qué orígenes son permitidos  
✅ **Filtros se cargan** correctamente desde MySQL  
✅ **Gráficos se generan** con datos reales  
✅ **Sin errores CORS** en la consola  

**El problema de CORS está completamente resuelto.** 🚀

---

## 📝 Notas Adicionales

### **Para producción:**

Esta configuración es **solo para desarrollo local**. En producción, debes:

1. Reemplazar el regex por dominios específicos:
   ```javascript
   const allowedOrigins = [
     'https://tu-dominio.com',
     'https://www.tu-dominio.com'
   ];
   ```

2. Usar variables de entorno:
   ```javascript
   const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
   ```

3. Considerar usar un proxy inverso (nginx, Apache)

### **Para otros desarrolladores:**

Si otro desarrollador clona el proyecto, solo necesita:
1. Instalar dependencias: `npm install`
2. Configurar `.env` con sus credenciales MySQL
3. Iniciar backend: `node app.js`
4. Iniciar Angular: `ng serve`

**No necesita cambiar ninguna configuración de CORS.**
